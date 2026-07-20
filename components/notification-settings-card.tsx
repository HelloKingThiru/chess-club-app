"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Loader2, Smartphone } from "lucide-react"
import { toast } from "sonner"

import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export function NotificationSettingsCard() {
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  const checkPushSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false)
      setPushSubscribed(false)
      return
    }

    setPushSupported(true)
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      setPushSubscribed(false)
      return
    }

    const subscription = await registration.pushManager.getSubscription()
    setPushSubscribed(Boolean(subscription))
  }, [])

  useEffect(() => {
    void checkPushSubscription()
  }, [checkPushSubscription])

  async function enablePushOnDevice() {
    setPushBusy(true)

    try {
      if (!pushSupported) {
        toast.error("Push notifications are not supported in this browser.")
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast.error("Notification permission was denied.")
        return
      }

      const vapidRes = await fetch("/api/push/vapid")
      const { publicKey } = (await vapidRes.json()) as { publicKey: string | null }

      if (!publicKey) {
        toast.error("Push is not configured on the server yet.")
        return
      }

      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"))

      await navigator.serviceWorker.ready

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Could not read push subscription.")
        return
      }

      const result = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setPushSubscribed(true)
      toast.success("Browser notifications enabled on this device.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enable push."
      )
    } finally {
      setPushBusy(false)
    }
  }

  async function disablePushOnDevice() {
    setPushBusy(true)

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()

      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint)
        await subscription.unsubscribe()
      }

      setPushSubscribed(false)
      toast.success("Browser notifications disabled on this device.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disable push."
      )
    } finally {
      setPushBusy(false)
    }
  }

  async function onPushToggle(enabled: boolean) {
    if (pushBusy) return
    if (enabled) {
      await enablePushOnDevice()
    } else {
      await disablePushOnDevice()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="size-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Get browser alerts for new announcements, events, and enrollments on
          this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="flex min-w-0 items-start gap-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="push-device" className="text-sm font-medium">
                This device
              </Label>
              <p className="text-xs text-muted-foreground">
                {pushSupported
                  ? "Browser pop-up alerts on this phone or computer."
                  : "Not supported in this browser."}
              </p>
            </div>
          </div>
          {pushSupported ? (
            <div className="flex items-center gap-2">
              {pushBusy ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
              <Switch
                id="push-device"
                checked={pushSubscribed}
                onCheckedChange={(checked) => void onPushToggle(checked)}
                disabled={pushBusy}
              />
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              Unavailable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

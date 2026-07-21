"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Loader2, Mail, Smartphone } from "lucide-react"
import { toast } from "sonner"

import {
  removePushSubscriptionAction,
  saveNotificationPreferencesAction,
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
import type { NotificationPreferences } from "@/lib/types/notifications"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

type NotificationSettingsCardProps = {
  initialPreferences: Pick<
    NotificationPreferences,
    "email_announcements" | "email_events" | "email_enrollment"
  >
}

export function NotificationSettingsCard({
  initialPreferences,
}: NotificationSettingsCardProps) {
  const [emailPrefs, setEmailPrefs] = useState(initialPreferences)
  const [emailBusy, setEmailBusy] = useState(false)
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

  async function updateEmailPreference(
    key: keyof typeof emailPrefs,
    enabled: boolean
  ) {
    const next = { ...emailPrefs, [key]: enabled }
    setEmailPrefs(next)
    setEmailBusy(true)

    try {
      const result = await saveNotificationPreferencesAction(next)
      if (result.error) {
        setEmailPrefs(emailPrefs)
        toast.error(result.error)
        return
      }
      toast.success("Email preferences updated.")
    } catch (error) {
      setEmailPrefs(emailPrefs)
      toast.error(
        error instanceof Error ? error.message : "Failed to save preferences."
      )
    } finally {
      setEmailBusy(false)
    }
  }

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

  const emailOptions = [
    {
      id: "email-announcements",
      key: "email_announcements" as const,
      label: "New announcements",
      description: "Email when a new club announcement is posted.",
    },
    {
      id: "email-events",
      key: "email_events" as const,
      label: "Event reminders (3 days)",
      description: "Email three days before any upcoming club event.",
    },
    {
      id: "email-enrollment",
      key: "email_enrollment" as const,
      label: "Enrollment reminders (1 day)",
      description: "Email one day before events you've signed up for.",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="size-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose how you want to hear about announcements and events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="size-4 text-muted-foreground" />
            Email
          </div>
          {emailOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {emailBusy ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : null}
                <Switch
                  id={option.id}
                  checked={emailPrefs[option.key]}
                  onCheckedChange={(checked) =>
                    void updateEmailPreference(option.key, checked)
                  }
                  disabled={emailBusy}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="size-4 text-muted-foreground" />
            Browser push
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="push-device" className="text-sm font-medium">
                This device
              </Label>
              <p className="text-xs text-muted-foreground">
                {pushSupported
                  ? "Pop-up alerts on this phone or computer."
                  : "Not supported in this browser."}
              </p>
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
        </div>
      </CardContent>
    </Card>
  )
}

import { Bell, Check, Headphones, Package, Users } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, ReadOnlyField } from '@/components/ui/Field'
import { Pill } from '@/components/ui/Pill'
import { subscriptionFeatures } from '@/lib/mockData'
import { useStore } from '@/lib/store'

const featureIcons = [Package, Users, Bell, Headphones]

export function AccountPanel() {
  const { account, setAccount } = useStore()

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Account information"
          actions={<Button size="sm">Manage billing</Button>}
        />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={account.companyName}
                onChange={(e) => setAccount({ companyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="billing-email">Billing email</Label>
              <Input
                id="billing-email"
                type="email"
                value={account.billingEmail}
                onChange={(e) => setAccount({ billingEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-hairline-subtle pt-5 sm:grid-cols-2">
            <ReadOnlyField label="Country" value="United States" />
            <ReadOnlyField
              label="Renews on"
              value={<span className="tnum">Jun 11, 2026</span>}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Subscription"
          actions={<Pill className="bg-brand-tint text-brand">{account.tier}</Pill>}
        />
        <CardBody>
          <p className="display text-[26px] leading-none text-ink">$20</p>
          <p className="mt-1 text-[12px] text-ink-muted">per month</p>

          <ul className="mt-5 space-y-2.5 border-t border-hairline-subtle pt-4">
            {subscriptionFeatures.map((feature, i) => {
              const Icon = featureIcons[i] ?? Check
              return (
                <li key={feature} className="flex items-start gap-2.5 text-[13px] text-ink-secondary">
                  <Icon size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                  {feature}
                </li>
              )
            })}
          </ul>

          <Button variant="primary" className="mt-5 w-full">
            See plans
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

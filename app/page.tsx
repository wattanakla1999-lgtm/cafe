import Link from "next/link";
import { Button } from "../components/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--color-primary)]">Cafe System</h1>
          <p className="text-[var(--color-coffee-500)]">Select your role to continue</p>
        </div>

        <div className="grid gap-4">
          <Link href="/menu">
            <Button fullWidth size="lg" variant="primary">
              Scan QR (Customer)
            </Button>
          </Link>

          <Link href="/counter">
            <Button fullWidth size="lg" variant="secondary">
              Counter (Staff)
            </Button>
          </Link>

          <div className="pt-8 border-t border-[var(--color-coffee-200)] grid gap-4">
            <p className="text-sm font-bold text-[var(--color-coffee-400)]">Staff Display Screens</p>
            <Link href="/admin/menu">
              <Button fullWidth variant="outline" className="border-dashed border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-coffee-50)]">
                Manage Menu (Admin)
              </Button>
            </Link>
            <Link href="/orders">
              <Button fullWidth variant="outline">
                Kitchen/Bar Screen
              </Button>
            </Link>
            <Link href="/call">
              <Button fullWidth variant="ghost">
                Calling Screen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

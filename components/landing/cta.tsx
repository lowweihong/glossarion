import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Network } from 'lucide-react'

export function CTA() {
  return (
    <section id="demo" className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/50 p-12 md:p-16">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Network className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Extract Knowledge?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Try our interactive demo with sample documents or upload your own.
            No signup required to explore.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/demo">
                Launch Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Contact Sales
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Enterprise plans available with custom Neo4j deployments and dedicated support.
          </p>
        </div>
      </div>
    </section>
  )
}

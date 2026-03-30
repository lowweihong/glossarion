import { Upload, Cpu, GitBranch, Lightbulb } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload Documents',
    description:
      'Drag and drop your PDF, text, or Markdown files. Our system accepts multiple formats and handles batch uploads.',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI Processing',
    description:
      'Our AI analyzes your content, extracting entities like people, organizations, concepts, and events with contextual understanding.',
  },
  {
    icon: GitBranch,
    step: '03',
    title: 'Graph Construction',
    description:
      'Entities are connected through discovered relationships, building a rich knowledge graph stored in Neo4j.',
  },
  {
    icon: Lightbulb,
    step: '04',
    title: 'Explore Insights',
    description:
      'Navigate your knowledge visually, query relationships, and discover patterns hidden in your document corpus.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border/50 bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From raw documents to structured knowledge in four simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-primary/50 to-transparent lg:block" />
              )}

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.step}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

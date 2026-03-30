import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FileText,
  Brain,
  Network,
  Zap,
  Database,
  BarChart3,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Multi-Format Support',
    description:
      'Upload PDF, text, and Markdown documents. Our parser extracts clean content ready for AI processing.',
  },
  {
    icon: Brain,
    title: 'AI Entity Extraction',
    description:
      'GPT-powered extraction identifies people, organizations, concepts, locations, and more with high accuracy.',
  },
  {
    icon: Network,
    title: 'Relationship Mapping',
    description:
      'Automatically discover connections between entities. Build a web of knowledge from your documents.',
  },
  {
    icon: Database,
    title: 'Neo4j Storage',
    description:
      'Enterprise-grade graph database ensures your knowledge persists, scales, and queries efficiently.',
  },
  {
    icon: Zap,
    title: 'Real-time Processing',
    description:
      'Watch your knowledge graph grow in real-time as documents are processed and entities are linked.',
  },
  {
    icon: BarChart3,
    title: 'Smart Insights',
    description:
      'Get actionable insights: key entities, relationship patterns, and knowledge summaries at a glance.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need for Knowledge Extraction
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A complete toolkit for transforming unstructured documents into
            structured, queryable knowledge graphs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card"
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

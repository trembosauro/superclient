import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const projects = [
    {
      title: "Picpay",
      description:
        "Redesign of PicPay website homepage. Achieved 40% increase in new account registrations and 25% growth in user retention time through improved UX, standardized components, and clearer navigation.",
      image: "/portfolio/picpay-new-version.webp",
      link: "https://www.behance.net/gallery/221095447/Picpay",
      tags: ["UX Design", "Web Design", "Fintech"],
    },
    {
      title: "C6 Bank",
      description:
        "Digital banking platform design focusing on user-centered interactions and intuitive financial workflows.",
      image: "/portfolio/c6bank-project.webp",
      link: "https://www.behance.net/kahue",
      tags: ["Product Design", "Fintech", "Mobile"],
    },
    {
      title: "BTG+",
      description:
        "Investment platform redesign combining research, design systems, and data-informed iteration for better user engagement.",
      image: "/portfolio/btg-project.webp",
      link: "https://www.behance.net/kahue",
      tags: ["Product Design", "Finance", "UX Research"],
    },
    {
      title: "Bell App",
      description:
        "Mobile application design with focus on accessibility and seamless user experience across all touchpoints.",
      image: "/portfolio/bell-app-project.webp",
      link: "https://www.behance.net/kahue",
      tags: ["Mobile Design", "App Design", "UX"],
    },
    {
      title: "Le Biscuit",
      description:
        "E-commerce platform redesign with improved product discovery and checkout experience.",
      image: "/portfolio/lebiscuit-project.webp",
      link: "https://www.behance.net/kahue",
      tags: ["E-commerce", "Web Design", "UX"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 bg-gradient-to-b from-background via-background to-card/20">
        <div className="container">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-8">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-semibold">
                Senior UX & Product Designer
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
              Crafting Digital Experiences That Matter
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed max-w-2xl">
              With 10+ years of experience across fintech, e-commerce, telecom, and SaaS, I combine research-driven design, interaction design, and data-informed iteration to deliver products that users love.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#projects"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent text-accent-foreground rounded-full font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                View My Work
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://www.behance.net/kahue"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-border text-foreground rounded-full font-semibold hover:bg-card/50 transition-colors"
              >
                Behance Portfolio
              </a>
            </div>


          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-10">
              About Me
            </h2>

            <div className="space-y-6 text-foreground/75 leading-relaxed">
              <p className="text-lg font-medium text-foreground">
                Senior Product Designer with 10+ years of experience across fintech, e-commerce, telecom, SaaS, and decision-support platforms.
              </p>

              <p className="text-lg">
                Delivering measurable business outcomes through UX strategy, data-informed design, and scalable systems.
              </p>

              <p className="text-lg">
                End-to-end product designer combining research, design systems, interaction design, and front-end implementation to create impactful digital experiences.
              </p>

              <p className="text-lg">
                Strong collaborator with Product, Engineering, Data, and ML teams. Bilingual in English and Portuguese. Background in both UX and front-end accelerates validation, quality, and team alignment.
              </p>

              <div className="mt-10 pt-10 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground mb-8">
                  Skills
                </h3>
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Research</h4>
                    <p className="text-foreground/70 text-sm">Discovery, user interviews, JTBD, usability testing, heuristic review, journey mapping, analytics</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Design & IA</h4>
                    <p className="text-foreground/70 text-sm">Information architecture, interaction design, UI design, design systems, accessibility (WCAG)</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Prototyping & Validation</h4>
                    <p className="text-foreground/70 text-sm">Wireframes, rapid and high-fidelity prototypes, A/B testing, experiment design</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Data & Metrics</h4>
                    <p className="text-foreground/70 text-sm">Funnel analysis, cohort analysis, conversion, retention, metric storytelling</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">AI & Automation</h4>
                    <p className="text-foreground/70 text-sm">AI feature design, copilots, recommendations, prompt UX, fallback flows</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Development & Tech</h4>
                    <p className="text-foreground/70 text-sm">HTML, CSS, JavaScript, React, WordPress, PostgreSQL, Git</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-accent mb-3">Collaboration & Delivery</h4>
                    <p className="text-foreground/70 text-sm">Stakeholder alignment, OKRs, roadmap prioritization, mentoring</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-border">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Top Skills
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Figma",
                    "UI Design",
                    "UX Research",
                    "User Experience",
                    "Product Design",
                  ].map((skill) => (
                    <div
                      key={skill}
                      className="px-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground/70 font-medium hover:border-accent/50 transition-colors"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 md:py-28 bg-card/30">
        <div className="container">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured Projects
          </h2>
          <p className="text-foreground/70 mb-14 max-w-2xl text-lg">
            A selection of my recent work showcasing my approach to design and problem-solving across different industries.
          </p>

          <div className="grid md:grid-cols-2 gap-7 mb-12">
            {projects.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://www.behance.net/kahue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all font-semibold text-lg"
            >
              View all projects on Behance
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

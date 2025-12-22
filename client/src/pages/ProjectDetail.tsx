import { useParams, useLocation } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const projectsData: Record<string, any> = {
  picpay: {
    title: "Picpay",
    subtitle: "Redesign of PicPay website homepage",
    image: "/picpay-new-version.webp",
    link: "https://www.behance.net/gallery/221095447/Picpay",
    tags: ["UX Design", "Web Design", "Fintech"],
    overview:
      "Redesign of PicPay website homepage. In the new version of the project, we achieved significant results: there was nearly a 40% increase in new account registrations, showing more users are interested in and trusting the platform. Additionally, user retention time grew by 25%, indicating they are using the service longer, reflecting better experience and satisfaction.",
    challenge:
      "The original PicPay website had complex navigation, unclear value propositions, and inconsistent component usage. Users struggled to understand the platform's benefits and complete the registration process efficiently.",
    solution:
      "We focused on several key improvements: Improved texts to be clearer, more objective, and easier to understand, making navigation and app use simpler. Standardized and created components, ensuring a more consistent, organized, and intuitive user interface. Standardized button labels, making actions clearer and uniform across the platform, helping avoid confusion and improving usability.",
    results: [
      "40% increase in new account registrations",
      "25% growth in user retention time",
      "Approved on first review by executives",
      "Faster time to launch",
    ],
    process:
      "The pages were approved on the first review, and executives requested they be launched quickly, expecting positive results, which were confirmed by the data. These changes contributed to a smoother and more pleasant experience, directly supporting the increase in registrations and user retention.",
    skills: [
      "UX Research",
      "Information Architecture",
      "UI Design",
      "Design Systems",
      "Interaction Design",
      "User Testing",
    ],
  },
  "c6-bank": {
    title: "C6 Bank",
    subtitle: "Digital banking platform design",
    image: "/c6bank-project.webp",
    link: "https://www.behance.net/kahue",
    tags: ["Product Design", "Fintech", "Mobile"],
    overview:
      "Digital banking platform design focusing on user-centered interactions and intuitive financial workflows. This project combined extensive user research with modern design principles to create a seamless banking experience.",
    challenge:
      "Traditional banking interfaces are often complex and intimidating for users. The challenge was to simplify financial operations while maintaining security and compliance requirements.",
    solution:
      "Developed a clean, intuitive interface with progressive disclosure of information. Created reusable components for common banking operations and implemented clear visual hierarchy for transaction management.",
    results: [
      "Improved user onboarding completion rate",
      "Reduced support tickets related to navigation",
      "Positive user feedback on interface clarity",
    ],
    process:
      "Through iterative design and user testing, we validated each interaction pattern and refined the visual design to meet both user needs and business requirements.",
    skills: [
      "Product Design",
      "User Research",
      "Interaction Design",
      "Accessibility",
      "Mobile Design",
    ],
  },
  "btg-plus": {
    title: "BTG+",
    subtitle: "Investment platform redesign",
    image: "/btg-project.webp",
    link: "https://www.behance.net/kahue",
    tags: ["Product Design", "Finance", "UX Research"],
    overview:
      "Investment platform redesign combining research, design systems, and data-informed iteration for better user engagement. This project focused on making investment accessible to a broader audience.",
    challenge:
      "Complex financial data and investment terminology created barriers for new investors. The platform needed to educate users while maintaining professional credibility.",
    solution:
      "Implemented progressive education with contextual help, created visual representations of complex data, and designed intuitive workflows for investment decisions.",
    results: [
      "Increased user engagement with investment tools",
      "Higher conversion rate for new investors",
      "Improved user confidence in platform",
    ],
    process:
      "Data-driven design decisions based on user behavior analytics and continuous A/B testing ensured optimal user experience.",
    skills: [
      "UX Research",
      "Data Analysis",
      "Design Systems",
      "Information Architecture",
      "Interaction Design",
    ],
  },
  "bell-app": {
    title: "Bell App",
    subtitle: "Mobile application design",
    image: "/bell-app-project.webp",
    link: "https://www.behance.net/kahue",
    tags: ["Mobile Design", "App Design", "UX"],
    overview:
      "Mobile application design with focus on accessibility and seamless user experience across all touchpoints. This project prioritized inclusive design principles.",
    challenge:
      "Creating an accessible mobile experience that works for users of all abilities while maintaining modern design aesthetics.",
    solution:
      "Implemented WCAG accessibility guidelines, conducted testing with users with disabilities, and designed with touch-first interactions in mind.",
    results: [
      "WCAG AA compliance achieved",
      "Positive accessibility audit results",
      "Broader user base reach",
    ],
    process:
      "Accessibility was integrated from the beginning of the design process, not added as an afterthought.",
    skills: [
      "Mobile Design",
      "Accessibility (WCAG)",
      "User Testing",
      "Interaction Design",
      "UI Design",
    ],
  },
  "le-biscuit": {
    title: "Le Biscuit",
    subtitle: "E-commerce platform redesign",
    image: "/lebiscuit-project.webp",
    link: "https://www.behance.net/kahue",
    tags: ["E-commerce", "Web Design", "UX"],
    overview:
      "E-commerce platform redesign with improved product discovery and checkout experience. This project aimed to increase conversion rates and customer satisfaction.",
    challenge:
      "High cart abandonment rates and difficulty in product discovery were limiting sales. The platform needed a more intuitive shopping experience.",
    solution:
      "Redesigned product discovery with advanced filtering and recommendations, simplified checkout process, and improved product information presentation.",
    results: [
      "Reduced cart abandonment by 30%",
      "Increased average order value",
      "Improved customer satisfaction scores",
    ],
    process:
      "Through heatmap analysis, user interviews, and A/B testing, we continuously optimized the shopping experience.",
    skills: [
      "E-commerce UX",
      "Conversion Optimization",
      "User Research",
      "Interaction Design",
      "Data Analysis",
    ],
  },
};

export default function ProjectDetail() {
  const { project } = useParams<{ project: string }>();
  const [, setLocation] = useLocation();

  if (!project || !projectsData[project]) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Project not found
          </h1>
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const data = projectsData[project];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20">
        <div className="container max-w-4xl mx-auto">
          <button
            onClick={() => setLocation("/#projects")}
            className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all font-semibold mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to projects
          </button>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
            {data.title}
          </h1>
          <p className="text-xl text-foreground/70 mb-8">{data.subtitle}</p>

          <div className="flex flex-wrap gap-2 mb-12">
            {data.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-sm text-accent font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {data.image && (
            <img
              src={data.image}
              alt={data.title}
              className="w-full rounded-[var(--radius-card)] mb-12 border border-border"
            />
          )}

          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Overview
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed">
                {data.overview}
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Challenge
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed">
                {data.challenge}
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Solution
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed">
                {data.solution}
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Results
              </h2>
              <ul className="space-y-3">
                {data.results.map((result: string) => (
                  <li
                    key={result}
                    className="flex items-start gap-3 text-lg text-foreground/75"
                  >
                    <span className="text-accent font-bold mt-1">✓</span>
                    {result}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Process
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed">
                {data.process}
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Skills Used
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.skills.map((skill: string) => (
                  <div
                    key={skill}
                    className="px-4 py-3 bg-card border border-border rounded-[var(--radius-card)] text-sm text-foreground/70 font-medium"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-8 border-t border-border">
              <a
                href={data.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-accent-foreground rounded-[var(--radius-button)] font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                View on Behance
                <ExternalLink className="w-4 h-4" />
              </a>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

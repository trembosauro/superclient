import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ProjectCardProps {
  title: string;
  description: string;
  image?: string;
  link: string;
  tags?: string[];
  detailPath?: string;
}

export default function ProjectCard({
  title,
  description,
  image,
  link,
  tags = [],
  detailPath,
}: ProjectCardProps) {
  const projectSlug = title.toLowerCase().replace(/\s+/g, "-").replace(/\+/g, "plus");
  const internalLink = detailPath || `/project/${projectSlug}`;

  return (
    <div className="group flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
      {image && (
        <Link href={internalLink}>
          <div className="relative w-full h-56 overflow-hidden bg-muted cursor-pointer">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>
      )}
      
      <div className="flex flex-col flex-1 p-6 md:p-7">
        <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-foreground/70 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
          {description}
        </p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <Link href={internalLink} className="flex items-center gap-2 text-accent font-medium text-sm hover:gap-3 transition-all">
            View Details
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground/60 hover:text-accent font-medium text-sm transition-colors"
            title="View on Behance"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  schema?: object | object[];
  noIndex?: boolean;
  openGraphType?: "website" | "article";
}

const BASE_URL = "https://reelsanylizer.in";
const DEFAULT_OG_IMAGE = `${BASE_URL}/favicon.png`;

const SEOHead = ({
  title,
  description,
  canonical,
  keywords,
  ogImage,
  schema,
  noIndex = false,
  openGraphType = "website",
}: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const resolvedCanonical = canonical ?? `${BASE_URL}${window.location.pathname}`;
    const resolvedOgImage = ogImage ?? DEFAULT_OG_IMAGE;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const ensureCanonical = () => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = resolvedCanonical;
    };

    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph + Twitter cards for rich previews
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", openGraphType, true);
    setMeta("og:url", resolvedCanonical, true);
    setMeta("og:image", resolvedOgImage, true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", resolvedOgImage);

    ensureCanonical();

    if (schema) {
      const script = (document.getElementById("seo-json-ld") as HTMLScriptElement | null) ?? document.createElement("script");
      script.id = "seo-json-ld";
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify(schema);
      if (!script.parentElement) {
        document.head.appendChild(script);
      }
    } else {
      const existing = document.getElementById("seo-json-ld");
      if (existing?.parentElement) existing.parentElement.removeChild(existing);
    }

    return () => {
      document.title = "Free Reel Analyzer — AI Instagram Reel Analysis Tool | 3 Free Credits";
    };
    // Note: canonical URLs should use reelsanylizer.in domain
  }, [title, description, canonical, keywords, ogImage, schema, noIndex, openGraphType]);

  return null;
};

export default SEOHead;

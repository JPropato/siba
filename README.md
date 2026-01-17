# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### react-best-practices

Industry best practices for React and Next.js performance optimization. Contains 40+ rules across 8 categories, prioritized by impact.

**Use when:**
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Optimizing bundle size or load times

**Categories covered:**
- Eliminating waterfalls (Critical)
- Bundle size optimization (Critical)
- Server-side performance (High)
- Client-side data fetching (Medium-High)
- Re-render optimization (Medium)
- Rendering performance (Medium)
- JavaScript micro-optimizations (Low-Medium)

### web-design-guidelines

Review UI code for compliance with web interface best practices. Audits your code for 100+ rules covering accessibility, performance, and UX.

**Use when:**
- "Review my UI"
- "Check accessibility"
- "Audit design"
- "Review UX"
- "Check my site against best practices"

### dokploy-deploy

Deploy applications to Dokploy using the CLI or API.

**Use when:**
- "Deploy to dokploy"
- "Push to production"
- "Set up dokploy deployment"

## Installation

Skills in this repository are located in `.agent/skills/` and are automatically discovered by Antigravity.

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**
```
Deploy my app
```
```
Review this React component for performance issues
```
```
Help me optimize this Next.js page
```

## Skill Structure

Each skill contains:
- `SKILL.md` - Instructions for the agent
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)

## License

MIT

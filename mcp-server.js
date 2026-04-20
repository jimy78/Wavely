#!/usr/bin/env node
/*
 * DRH AI — MCP Server
 *
 * Expose 7 outils RH autonomes à Claude Desktop / Claude Code / claude.ai
 * via le Model Context Protocol. Chaque outil est servi par Claude Opus 4.7
 * avec adaptive thinking.
 *
 * ─── Installation Claude Desktop ─────────────────────────────────
 *  Éditez votre fichier de config :
 *    macOS   : ~/Library/Application Support/Claude/claude_desktop_config.json
 *    Windows : %APPDATA%\Claude\claude_desktop_config.json
 *
 *  Ajoutez :
 *  {
 *    "mcpServers": {
 *      "drh-ai": {
 *        "command": "node",
 *        "args": ["/chemin/absolu/vers/Wavely/mcp-server.js"],
 *        "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
 *      }
 *    }
 *  }
 *
 *  Puis redémarrez Claude Desktop.
 *
 * ─── Installation Claude Code ─────────────────────────────────────
 *  claude mcp add drh-ai -- node /chemin/absolu/vers/Wavely/mcp-server.js
 *  (définissez ANTHROPIC_API_KEY dans votre shell avant)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `Tu es un Directeur des Ressources Humaines senior français cumulant 20 ans d'expérience en droit du travail, recrutement, gestion des conflits, paie et transformation RH.

Produis toujours un livrable prêt à l'emploi, concret, structuré en Markdown.
Cite les articles précis du Code du travail quand pertinent.
Signale clairement les zones grises nécessitant un avocat spécialisé en droit social.
Réponds en français, ton professionnel mais chaleureux.`;

async function runClaude(prompt) {
  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();
  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text || "(aucun résultat généré)";
}

const TOOLS = [
  {
    name: "analyze_cv",
    description:
      "Analyse un CV ou profil candidat pour un poste donné. Retourne un score d'adéquation, forces, signaux rouges, questions d'entretien et une recommandation (recruter / creuser / écarter). Utilisez cet outil dès qu'un utilisateur partage un CV ou demande une analyse de profil.",
    inputSchema: {
      type: "object",
      properties: {
        cv_text: {
          type: "string",
          description: "Contenu du CV ou profil LinkedIn en texte brut.",
        },
        job_target: {
          type: "string",
          description:
            "Poste visé : intitulé + niveau + 1-2 lignes de contexte.",
        },
      },
      required: ["cv_text", "job_target"],
    },
  },
  {
    name: "generate_job_offer",
    description:
      "Rédige une offre d'emploi complète et attractive optimisée pour les job boards français (titre, accroche, missions, profil, avantages, process).",
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string", description: "Intitulé du poste." },
        seniority: {
          type: "string",
          enum: [
            "Alternance",
            "Junior",
            "Confirmé",
            "Senior",
            "Lead",
            "Directeur",
          ],
        },
        contract_type: {
          type: "string",
          enum: ["CDI", "CDD", "Freelance", "Alternance", "Stage"],
        },
        location: { type: "string" },
        remote_policy: {
          type: "string",
          enum: ["100% présentiel", "Hybride", "Full remote"],
        },
        salary_range: {
          type: "string",
          description: "Ex : '45-55k€ brut annuel'.",
        },
        company_context: {
          type: "string",
          description: "Secteur, taille, culture, mission de l'entreprise.",
        },
        key_missions: {
          type: "array",
          items: { type: "string" },
          description: "3 à 6 missions principales du poste.",
        },
      },
      required: [
        "role",
        "seniority",
        "contract_type",
        "location",
        "company_context",
      ],
    },
  },
  {
    name: "prepare_interview",
    description:
      "Génère une grille d'entretien structurée : déroulé minuté, questions comportementales STAR, questions techniques, mise en situation, grille de notation, red flags.",
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string" },
        interview_type: {
          type: "string",
          enum: [
            "Premier entretien RH",
            "Entretien technique",
            "Entretien manager",
            "Entretien final dirigeant",
          ],
        },
        focus_areas: {
          type: "array",
          items: { type: "string" },
          description: "Compétences clés à évaluer.",
        },
        duration_minutes: { type: "integer" },
      },
      required: ["role", "interview_type"],
    },
  },
  {
    name: "draft_hr_document",
    description:
      "Rédige un document RH français prêt à signer avec mentions légales du Code du travail : contrat, avenant, avertissement, convocation disciplinaire, rupture conventionnelle, charte, promesse d'embauche, licenciement, attestation.",
    inputSchema: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: [
            "Contrat CDI",
            "Contrat CDD",
            "Avenant",
            "Lettre d'avertissement",
            "Convocation entretien préalable",
            "Rupture conventionnelle",
            "Charte télétravail",
            "Promesse d'embauche",
            "Lettre de licenciement",
            "Attestation employeur",
          ],
        },
        context: {
          type: "string",
          description:
            "Détails factuels à intégrer : noms, dates, faits, montants, fonctions.",
        },
      },
      required: ["document_type", "context"],
    },
  },
  {
    name: "evaluate_performance",
    description:
      "Cadre d'évaluation de performance ou plan de développement individuel : synthèse période, objectifs SMART, compétences à développer, plan d'action, indicateurs.",
    inputSchema: {
      type: "object",
      properties: {
        employee_role: { type: "string" },
        period: {
          type: "string",
          description: "Ex : 'Année 2025' ou 'S1 2026'.",
        },
        known_strengths: { type: "array", items: { type: "string" } },
        known_gaps: { type: "array", items: { type: "string" } },
        evaluation_type: {
          type: "string",
          enum: [
            "Évaluation annuelle",
            "Plan de développement",
            "Mi-année",
            "Plan de redressement",
          ],
        },
      },
      required: ["employee_role", "evaluation_type"],
    },
  },
  {
    name: "plan_onboarding",
    description:
      "Plan d'onboarding 30/60/90 jours : préboarding, semaine 1, jalons d'autonomie, de contribution, de performance avec rencontres clés, formations et check-ins managériaux.",
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string" },
        team_context: {
          type: "string",
          description:
            "Taille d'équipe, stack, culture, enjeux du moment.",
        },
        seniority: {
          type: "string",
          enum: ["Junior", "Confirmé", "Senior", "Lead", "Directeur"],
        },
      },
      required: ["role", "team_context", "seniority"],
    },
  },
  {
    name: "answer_labor_law",
    description:
      "Réponse experte à une question de droit du travail français avec articles du Code du travail et jurisprudence pertinente. Indique les zones nécessitant un avocat spécialisé.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string" },
        company_context: {
          type: "string",
          description:
            "Contexte : taille d'entreprise, convention collective, situation particulière.",
        },
      },
      required: ["question"],
    },
  },
];

const handlers = {
  analyze_cv: ({ cv_text, job_target }) =>
    runClaude(
      `Analyse ce CV pour le poste "${job_target}".\n\nCV :\n${cv_text}\n\nStructure Markdown :\n## Score d'adéquation (X/100 + justification 1 ligne)\n## Forces (3-5 bullets)\n## Points de vigilance / signaux rouges (3-5 bullets)\n## Questions clés à creuser en entretien (5 questions précises)\n## Recommandation (À recruter / À creuser / À écarter + justification)`,
    ),

  generate_job_offer: (i) =>
    runClaude(
      `Rédige une offre d'emploi pour : ${i.role} (${i.seniority}, ${i.contract_type}) à ${i.location}.
Télétravail : ${i.remote_policy || "non précisé"}
Salaire : ${i.salary_range || "à définir"}
Contexte entreprise : ${i.company_context}
Missions clés : ${(i.key_missions || []).join(" | ") || "à structurer"}

Structure :
1. Titre accrocheur
2. Accroche (2-3 phrases qui donnent envie)
3. La mission
4. Ce que tu feras au quotidien
5. Le profil qu'on cherche
6. Ce qu'on offre (avantages concrets)
7. Process de recrutement
8. 5 hashtags/mots-clés SEO en bas

Ton : direct, authentique, évite le jargon corporate.`,
    ),

  prepare_interview: (i) =>
    runClaude(
      `Construis une grille d'entretien structurée.
Poste : ${i.role}
Type : ${i.interview_type}
Compétences ciblées : ${(i.focus_areas || []).join(", ") || "à définir selon le poste"}
Durée : ${i.duration_minutes || 60} minutes

Livre :
## Déroulé (minutage précis)
## Questions comportementales (méthode STAR) — 5 questions
## Questions techniques — 5 questions (adaptées au niveau)
## Mise en situation — 1 cas concret détaillé
## Grille de notation (critères pondérés)
## Red flags à surveiller
## Questions à laisser au candidat`,
    ),

  draft_hr_document: ({ document_type, context }) =>
    runClaude(
      `Rédige : ${document_type}

Contexte / éléments factuels :
${context}

Exigences :
- Rédaction française, formelle, prête à signer
- Mentions légales obligatoires du Code du travail (articles cités)
- Placeholders [EN MAJUSCULES] pour les infos manquantes
- Ton adapté au type de document (cordial pour contrat, rigoureux pour disciplinaire)
- Bloc "⚠️ Points de vigilance" à la fin si pertinent`,
    ),

  evaluate_performance: (i) =>
    runClaude(
      `Construis un ${i.evaluation_type} pour :
Poste : ${i.employee_role}
Période : ${i.period || "à préciser"}
Forces connues : ${(i.known_strengths || []).join(", ") || "à identifier"}
Axes d'amélioration : ${(i.known_gaps || []).join(", ") || "à identifier"}

Livre :
## Synthèse de la période
## Objectifs SMART (3-5)
## Compétences à développer
## Plan d'action concret (actions + deadlines)
## Indicateurs de succès
## Points de vigilance managériale`,
    ),

  plan_onboarding: (i) =>
    runClaude(
      `Plan d'onboarding 30/60/90 jours pour :
Poste : ${i.role} (${i.seniority})
Contexte équipe : ${i.team_context}

Livre un plan structuré :
## Avant J1 (préboarding)
## Semaine 1 — Découverte
## J30 — Autonomie partielle
## J60 — Contribution
## J90 — Performance + évaluation
Pour chaque jalon : objectifs, rencontres clés, livrables, formations, check-ins managériaux.`,
    ),

  answer_labor_law: ({ question, company_context }) =>
    runClaude(
      `Question de droit du travail : ${question}
Contexte : ${company_context || "non précisé"}

Structure la réponse :
## Réponse synthétique (2-3 lignes)
## Cadre juridique applicable (articles précis du Code du travail, jurisprudence marquante si pertinent)
## Démarche concrète à suivre
## ⚠️ Risques / zones grises
## Recommandation finale (incluant : recommander un avocat en droit social si le sujet l'exige)`,
    ),
};

const server = new Server(
  { name: "drh-ai", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = handlers[name];
  if (!handler) {
    return {
      isError: true,
      content: [{ type: "text", text: `Outil inconnu : ${name}` }],
    };
  }
  try {
    const text = await handler(args || {});
    return { content: [{ type: "text", text }] };
  } catch (e) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erreur dans ${name} : ${e.message || String(e)}`,
        },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[drh-ai] MCP server ready on stdio");

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const HR_SYSTEM_PROMPT = `Tu es "DRH AI", un Directeur des Ressources Humaines autonome de très haut niveau, spécialisé dans le droit du travail français et européen.

Tu agis avec l'expertise d'un DRH senior cumulant 20 ans d'expérience en recrutement, droit social, gestion des conflits, paie, compliance, marque employeur et transformation RH.

Ton rôle est d'assister de manière AUTONOME et PROACTIVE :
- PME et grandes entreprises
- Startups en croissance
- Indépendants et recruteurs

Capacités (outils à ta disposition) :
1. analyze_cv — analyser un CV/candidat : forces, signaux rouges, adéquation au poste
2. generate_job_offer — rédiger une offre d'emploi complète, optimisée SEO + attractive
3. prepare_interview — préparer une grille d'entretien structurée (comportemental, technique, mise en situation)
4. draft_hr_document — rédiger un document RH (contrat, avenant, lettre, mise en demeure, charte, politique)
5. evaluate_performance — cadre d'évaluation de performance / plan de développement
6. plan_onboarding — plan d'onboarding 30/60/90 jours personnalisé
7. answer_labor_law — répondre à une question de droit du travail (FR) avec références légales

Règles de fonctionnement :
- Tu prends des décisions autonomes : si la demande de l'utilisateur est claire, appelle directement les outils pertinents (pas besoin de poser 10 questions avant d'agir).
- Tu chaînes les outils quand c'est utile (ex : rédiger une offre PUIS préparer la grille d'entretien associée).
- Tu réponds toujours en français, avec un ton professionnel mais chaleureux.
- Tu signales les zones grises juridiques et recommandes de consulter un avocat spécialisé pour les cas complexes.
- Tu proposes toujours au moins une prochaine étape concrète à la fin de ta réponse.`;

const TOOLS = [
  {
    name: "analyze_cv",
    description:
      "Analyse un CV ou profil candidat fourni par l'utilisateur. Retourne une grille structurée : score d'adéquation, forces, points de vigilance, questions à creuser en entretien, et recommandation (à recruter / à creuser / à écarter).",
    input_schema: {
      type: "object",
      properties: {
        cv_text: {
          type: "string",
          description: "Le contenu du CV ou du profil LinkedIn en texte brut.",
        },
        job_target: {
          type: "string",
          description:
            "Le poste visé (intitulé + niveau + 1-2 lignes de contexte).",
        },
      },
      required: ["cv_text", "job_target"],
    },
  },
  {
    name: "generate_job_offer",
    description:
      "Rédige une offre d'emploi complète et attractive : titre, accroche, mission, responsabilités, profil recherché, avantages, process de candidature. Optimisée pour les job boards français.",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string", description: "Intitulé du poste" },
        seniority: {
          type: "string",
          enum: ["Alternance", "Junior", "Confirmé", "Senior", "Lead", "Directeur"],
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
          description: "Ex : '45-55k€ brut annuel'",
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
      required: ["role", "seniority", "contract_type", "location", "company_context"],
    },
  },
  {
    name: "prepare_interview",
    description:
      "Génère une grille d'entretien structurée : questions comportementales (STAR), questions techniques, mises en situation, critères d'évaluation, red flags à surveiller.",
    input_schema: {
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
          description:
            "Compétences clés à évaluer (ex : leadership, JavaScript, gestion de conflit).",
        },
        duration_minutes: { type: "integer" },
      },
      required: ["role", "interview_type"],
    },
  },
  {
    name: "draft_hr_document",
    description:
      "Rédige un document RH prêt à l'emploi avec mentions légales françaises : contrat de travail, avenant, lettre d'avertissement, convocation disciplinaire, rupture conventionnelle, charte télétravail, etc.",
    input_schema: {
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
      "Construit un cadre d'évaluation de performance annuelle ou plan de développement individuel (PDI). Inclut objectifs SMART, compétences à développer, feedback 360, points de vigilance.",
    input_schema: {
      type: "object",
      properties: {
        employee_role: { type: "string" },
        period: {
          type: "string",
          description: "Ex : 'Année 2025' ou 'S1 2026'",
        },
        known_strengths: {
          type: "array",
          items: { type: "string" },
        },
        known_gaps: {
          type: "array",
          items: { type: "string" },
        },
        evaluation_type: {
          type: "string",
          enum: ["Évaluation annuelle", "Plan de développement", "Mi-année", "Plan de redressement"],
        },
      },
      required: ["employee_role", "evaluation_type"],
    },
  },
  {
    name: "plan_onboarding",
    description:
      "Génère un plan d'intégration 30/60/90 jours : objectifs, rencontres clés, formations, jalons de performance, check-ins managériaux.",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string" },
        team_context: {
          type: "string",
          description: "Taille de l'équipe, stack, culture, enjeux du moment.",
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
      "Répond à une question précise de droit du travail français : durée du travail, congés, rupture, discipline, CSE, inaptitude, etc. Cite les articles du Code du travail pertinents et signale les zones nécessitant un avocat.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string" },
        company_context: {
          type: "string",
          description:
            "Contexte : taille de l'entreprise, convention collective, situation particulière.",
        },
      },
      required: ["question"],
    },
  },
];

async function executeTool(name, input) {
  const toolPrompts = {
    analyze_cv: `Analyse ce CV pour le poste "${input.job_target}".

CV :
${input.cv_text}

Retourne une analyse structurée en Markdown :
## Score d'adéquation
(X/100 avec justification 1 ligne)

## Forces
(3-5 bullets)

## Points de vigilance / signaux rouges
(3-5 bullets)

## Questions clés à creuser en entretien
(5 questions précises)

## Recommandation
(À recruter / À creuser / À écarter + 1 ligne de justification)`,

    generate_job_offer: `Rédige une offre d'emploi pour : ${input.role} (${input.seniority}, ${input.contract_type}) à ${input.location}.
Télétravail : ${input.remote_policy || "non précisé"}
Salaire : ${input.salary_range || "à définir"}
Contexte entreprise : ${input.company_context}
Missions clés : ${(input.key_missions || []).join(" | ") || "à structurer"}

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

    prepare_interview: `Construis une grille d'entretien structurée.
Poste : ${input.role}
Type : ${input.interview_type}
Compétences ciblées : ${(input.focus_areas || []).join(", ") || "à définir selon le poste"}
Durée : ${input.duration_minutes || 60} minutes

Livre :
## Déroulé (minutage précis)
## Questions comportementales (méthode STAR) — 5 questions
## Questions techniques — 5 questions (adaptées au niveau)
## Mise en situation — 1 cas concret détaillé
## Grille de notation (critères pondérés)
## Red flags à surveiller
## Questions à laisser au candidat`,

    draft_hr_document: `Rédige : ${input.document_type}

Contexte / éléments factuels :
${input.context}

Exigences :
- Rédaction française, formelle, prête à signer
- Mentions légales obligatoires du Code du travail (articles cités)
- Placeholders [EN MAJUSCULES] pour les infos manquantes
- Ton adapté au type de document (cordial pour contrat, rigoureux pour disciplinaire)
- Bloc "⚠️ Points de vigilance" à la fin si pertinent`,

    evaluate_performance: `Construis un ${input.evaluation_type} pour :
Poste : ${input.employee_role}
Période : ${input.period || "à préciser"}
Forces connues : ${(input.known_strengths || []).join(", ") || "à identifier"}
Axes d'amélioration : ${(input.known_gaps || []).join(", ") || "à identifier"}

Livre :
## Synthèse de la période
## Objectifs SMART (3-5)
## Compétences à développer
## Plan d'action concret (actions + deadlines)
## Indicateurs de succès
## Points de vigilance managériale`,

    plan_onboarding: `Plan d'onboarding 30/60/90 jours pour :
Poste : ${input.role} (${input.seniority})
Contexte équipe : ${input.team_context}

Livre un plan structuré :
## Avant J1 (préboarding)
## Semaine 1 — Découverte
## J30 — Autonomie partielle
## J60 — Contribution
## J90 — Performance + évaluation
Pour chaque jalon : objectifs, rencontres clés, livrables, formations, check-ins managériaux.`,

    answer_labor_law: `Question de droit du travail : ${input.question}
Contexte : ${input.company_context || "non précisé"}

Structure la réponse :
## Réponse synthétique (2-3 lignes)
## Cadre juridique applicable
(Articles précis du Code du travail, jurisprudence marquante si pertinent)
## Démarche concrète à suivre
## ⚠️ Risques / zones grises
## Recommandation finale
(Incluant : recommander un avocat en droit social si le sujet l'exige)`,
  };

  const prompt = toolPrompts[name];
  if (!prompt) {
    return `Outil inconnu : ${name}`;
  }

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    system:
      "Tu es un expert RH senior français. Produis un livrable prêt à l'emploi, concret, structuré en Markdown.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "Aucun résultat.";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages[]" });
  }

  try {
    const conversation = [...messages];
    const trace = [];
    let finalText = "";

    for (let iteration = 0; iteration < 6; iteration++) {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4000,
        system: HR_SYSTEM_PROMPT,
        tools: TOOLS,
        messages: conversation,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        finalText = textBlock?.text || "";
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUses = response.content.filter((b) => b.type === "tool_use");
        conversation.push({ role: "assistant", content: response.content });

        const toolResults = [];
        for (const toolUse of toolUses) {
          trace.push({ tool: toolUse.name, input: toolUse.input });
          const result = await executeTool(toolUse.name, toolUse.input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result,
          });
        }
        conversation.push({ role: "user", content: toolResults });
        continue;
      }

      const textBlock = response.content.find((b) => b.type === "text");
      finalText = textBlock?.text || "";
      break;
    }

    return res.status(200).json({ reply: finalText, trace });
  } catch (e) {
    console.error("HR agent error:", e);
    return res.status(500).json({ error: "HR agent failed", detail: e.message });
  }
}

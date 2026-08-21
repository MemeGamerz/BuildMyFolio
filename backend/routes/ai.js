const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Thinking config set to HIGH as requested
const generationConfig = {
    thinkingConfig: {
        thinkingLevel: 'HIGH'
    },
    responseMimeType: 'application/json'
};

// Model fallback chain: gemini-3.5-flash-lite -> gemini-2.5-flash -> gemma-4-31b-it -> gemma-4-26b-a4b-it
const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it'
];

async function generateWithFallback(prompt) {
    let lastError = null;
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig
            });
            const result = await model.generateContent(prompt);
            return result;
        } catch (err) {
            console.warn(`Model ${modelName} failed with json mode, trying fallback... Reason:`, err.message);
            lastError = err;
            // Retry without responseMimeType in case model doesn't support json mode natively
            try {
                const modelWithoutJsonMode = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        thinkingConfig: {
                            thinkingLevel: 'HIGH'
                        }
                    }
                });
                const result = await modelWithoutJsonMode.generateContent(prompt);
                return result;
            } catch (retryErr) {
                console.warn(`Model ${modelName} retry failed:`, retryErr.message);
                lastError = retryErr;
            }
        }
    }
    throw lastError || new Error('All generative AI models in fallback chain failed.');
}

function extractAndParseJSON(rawText) {
    if (!rawText) throw new Error('Empty response received from AI model.');

    let cleaned = rawText.trim();
    // Strip markdown code fences if wrapped in ```json ... ```
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // Direct JSON parse attempt
    try {
        const parsed = JSON.parse(cleaned);
        if (parsed.html && parsed.css) return parsed;
    } catch (e) {
        // Fallback to substring matching
    }

    // Regex extraction between outermost braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const substring = cleaned.substring(firstBrace, lastBrace + 1);
        try {
            const parsed = JSON.parse(substring);
            if (parsed.html && parsed.css) return parsed;
        } catch (e) {
            // Strip unescaped ASCII control characters except tabs/newlines
            const sanitized = substring.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, '');
            return JSON.parse(sanitized);
        }
    }

    throw new Error('Failed to parse valid { html, css } structure from AI response.');
}

const getFineTunedPrompt = (useCase, portfolioFormat, aesthetics, formattedDynamicContext, customInstructions) => {
    const universalRules = `
        ### CRITICAL INSTRUCTION 1: CONTENT REPHRASING & RESTRAINT ###
        1. REPHRASE and ELEVATE the user's input to fit a world-class professional portfolio or website structure.
        2. STRICT GROUNDING: Do NOT invent unbelievable claims or hollow corporate buzzwords. Keep the tone authentic, persuasive, and 100% human-written.
        3. Create impeccably organized, semantic HTML5 and clean CSS to house this content.

        ### CRITICAL INSTRUCTION 2: ULTRA-PREMIUM VERCEL/LINEAR/APPLE AESTHETICS ###
        1. Act as a Principal Design Engineer & Creative Technologist (Vercel, Linear, Apple, Stripe).
        2. The design MUST be minimalist, high-contrast, and deeply elegant. Use generous whitespace, crisp typography, and refined grid/flexbox layouts.
        3. Use subtle borders (e.g. \`1px solid var(--border)\`), soft ambient glows, and balanced color palettes.
        4. Fluid typography: Use modern CSS \`clamp()\` for headlines (e.g., \`font-size: clamp(2.2rem, 5vw, 4rem);\`).
        5. Mobile Responsiveness: Include \`@media (max-width: 768px)\` rules to smoothly stack grids and columns into a 1-column mobile layout.

        ### CRITICAL INSTRUCTION 3: THEME ENGINE & 60-30-10 DESIGN TOKENS ###
        1. Interpret the user's requested theme/aesthetic (e.g. "Emerald Forest", "Cyberpunk Neon", "Warm Scandinavian Minimal", "Midnight Luxury", "Retro Editorial") and map it to a cohesive palette using the **60-30-10 Color Rule**:
           - **60% Dominant (Canvas & Backgrounds)**: Clean neutral background (\`--bg\`, \`--surface\`, \`--surface-hover\`).
           - **30% Secondary (Typography & Structural Elements)**: High-contrast body text, headings, and borders (\`--text\`, \`--text-muted\`, \`--border\`, \`--border-subtle\`). Ensure a minimum 4.5:1 contrast ratio.
           - **10% Accent (CTAs, Badges & Highlights)**: An exquisite, theme-specific accent color (\`--accent\`, \`--accent-glow\`, \`--accent-fg\`).
        2. Define all colors and radii as CSS variables on \`#website-root\` and use them exclusively throughout:
           \`\`\`css
           #website-root {
             --bg: #090d16;
             --surface: rgba(255, 255, 255, 0.04);
             --surface-hover: rgba(255, 255, 255, 0.08);
             --border: rgba(255, 255, 255, 0.1);
             --border-subtle: rgba(255, 255, 255, 0.05);
             --text: #f8fafc;
             --text-muted: #94a3b8;
             --accent: #38bdf8;
             --accent-glow: rgba(56, 189, 248, 0.25);
             --accent-fg: #000000;
             --radius-sm: 8px;
             --radius-md: 16px;
             --radius-lg: 24px;
             background-color: var(--bg);
             color: var(--text);
             font-family: 'Inter', system-ui, -apple-system, sans-serif;
             min-height: 100vh;
             line-height: 1.6;
           }
           \`\`\`

        ### CRITICAL INSTRUCTION 4: SMOOTH MICRO-INTERACTIONS & TRANSITIONS ###
        1. All hover states must use ultra-smooth cubic-bezier easing: \`transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);\`.
        2. Use subtle hover lifts (\`transform: translateY(-2px);\`), subtle border highlights, and soft accent glows.
        3. Implement subtle entrance animations using \`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\`.

        ### CRITICAL INSTRUCTION 5: FUNCTIONAL JAVASCRIPT & SCRIPT TAGS ###
        1. If the layout includes interactive components (e.g. Dark/Light theme switcher, FAQ accordion toggle, mobile menu drawer, modal popup, filter tabs, copy-email toast), write robust, vanilla JavaScript to make them 100% functional.
        2. Wrap all JavaScript inside a \`<script>\` tag placed at the VERY BOTTOM of the \`html\` string output (inside or right after the #website-root container).
        3. Ensure JavaScript code executes after the DOM is ready using \`document.addEventListener('DOMContentLoaded', () => { ... })\` or equivalent self-executing safety checks.

        ### CRITICAL INSTRUCTION 6: STRICT JSON FORMATTING ###
        Return a single, valid JSON object with EXACTLY two keys:
        {
          "html": "Complete semantic HTML inside <div id=\\"website-root\\">...</div>, ending with any functional <script> tag. NO <html> or <body> tags.",
          "css": "Complete polished CSS targeting #website-root and internal classes. NO <style> tags."
        }
    `;

    const baseData = `
        ### USER REQUEST ###
        Aesthetics & Vibe requested: ${aesthetics || 'Ultra-modern, glassmorphism, clean, expensive, and graceful.'}
        
        ### SPECIFIC CONTENT CONTEXT ###
        ${formattedDynamicContext}

        ${customInstructions ? `### ADDITIONAL USER INSTRUCTIONS ###\n        ${customInstructions}\n        (CRITICAL: You MUST strictly adhere to these custom instructions above all else).` : ''}
    `;

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Website') {
        return `
        You are an Award-Winning Creative Director & Lead Frontend Architect.
        Your job is to generate a visual, high-impact personal portfolio website.

        ### ARCHITECTURE CONTEXT ###
        1. **Floating Glass Navbar**: Minimalist brand mark, navigational links (About, Work, Skills, Contact), and an "Available for Hire" or "Resume" CTA button.
        2. **Hero Section**: Pulsing availability badge, oversized headline, elevator pitch, high-resolution portrait/avatar placeholder (\`https://picsum.photos/400/400\`), and primary CTA buttons.
        3. **Bento-Grid Highlights & Skills**: Asymmetric modern grid showcasing core competencies, tech stack tags/chips, years of experience counter, and social links (GitHub, LinkedIn, X).
        4. **Selected Projects Showcase**: Dynamic project cards featuring mockup placeholders (\`https://picsum.photos/800/500\`), project title, description, tech stack pills, and live demo/case study buttons.
        5. **Experience & Milestones**: Clean chronological timeline or cards highlighting past roles and key achievements.
        6. **Interactive Contact Section**: Clean contact card with a functional copy-to-clipboard email button or direct contact form.
        7. **Minimalist Footer**: Copyright notice, social links, and smooth back-to-top button.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Resume (PDF)') {
        return `
        You are an Executive Recruiter & Master Resume/CV Layout Designer.
        Your job is to generate an impeccably structured, highly scannable, single-page A4 Curriculum Vitae (CV) document.
        CRITICAL: This is a professional print/PDF layout. It must fit cleanly on a standard A4 document without sprawling out of bounds.

        ### ARCHITECTURE CONTEXT (A4 RESUME PDF) ###
        1. **A4 Page Container**: Wrap the entire content inside an A4 canvas:
           \`width: 210mm; min-height: 297mm; max-width: 100%; margin: 40px auto; background: #ffffff; padding: 18mm 20mm; box-shadow: 0 10px 35px rgba(0,0,0,0.08); position: relative; border-radius: 4px; color: #0f172a; font-family: 'Inter', sans-serif;\`.
        2. **Header Block**: Candidate Name (prominent bold), Target Job Title (subtle muted), and clean horizontal contact bar (Email, Phone, Location, LinkedIn, Portfolio links). Optional clean circular headshot (\`https://picsum.photos/200/200\`).
        3. **Executive Summary**: 3-4 sentence impactful summary highlighting specialized domain experience, technical strengths, and track record.
        4. **Work Experience**: Structured timeline with Job Title, Company Name, Dates, and high-impact bullet points demonstrating quantifiable achievements (metrics, KPIs).
        5. **Education & Certifications**: Degree, Institution, Graduation Year, Honors/GPA.
        6. **Core Skills & Technologies**: Clean categorized skill tags/pills (e.g. Languages, Frameworks, Cloud & Tools).
        7. **STRICT RULES**:
           - NO collapsible mobile media queries that break print proportions or convert the A4 layout into a stacked mobile feed.
           - Ensure all parent containers maintain structural stability so items remain cleanly positioned.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Student Portfolio (PDF)') {
        return `
        You are an Ivy League Admissions Consultant & Academic Design Specialist.
        Your job is to generate an academic profile and student portfolio document highlighting scholarship, leadership, and campus impact.
        CRITICAL: This is a structured A4 document layout.

        ### ARCHITECTURE CONTEXT (A4 STUDENT PROFILE PDF) ###
        1. **A4 Page Container**: Wrap the entire content inside an A4 canvas:
           \`width: 210mm; min-height: 297mm; max-width: 100%; margin: 40px auto; background: #ffffff; padding: 18mm 20mm; box-shadow: 0 10px 35px rgba(0,0,0,0.08); position: relative; border-radius: 4px; color: #0f172a; font-family: 'Inter', sans-serif;\`.
        2. **Academic Header**: Student Name, Target Degree / Research Focus, University / Institution, and contact links with student headshot placeholder (\`https://picsum.photos/200/200\`).
        3. **Academic Objective & Manifesto**: Vision statement outlining academic ambitions and career goals.
        4. **Education & Honors**: Degree in progress, Major/Minor, GPA, Dean's List, Scholarships, Academic Awards.
        5. **Key Projects & Research**: Academic projects, lab research, or capstone works with methodology and outcome highlights.
        6. **Leadership & Extracurriculars**: Student organizations, club leadership, volunteer initiatives, and community achievements.
        7. **Relevant Coursework & Skills**: Course tags and technical/laboratory competencies.
        8. **STRICT RULES**:
           - NO collapsible mobile media queries that collapse the A4 page size.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Startup Landing Page') {
        return `
        You are a Principal Product Designer & Growth Architect at a top Y Combinator SaaS startup.
        Your job is to generate a high-converting, modern SaaS landing page.

        ### ARCHITECTURE CONTEXT ###
        1. **Sticky Glass Navbar**: Logo with badge, Navigation links (Features, Solutions, Pricing, FAQ), and high-contrast "Start Free Trial" CTA.
        2. **High-Impact Hero**:
           - Pill announcement badge (e.g., "⚡ Next-Gen AI Automation v2.4").
           - High-converting headline with dynamic gradient text & compelling subtitle.
           - Dual CTA buttons: Primary "Get Started Free" with subtle glow + Secondary "Book a 15-min Demo".
           - High-fidelity interactive Product Dashboard UI mockup preview (\`https://picsum.photos/1200/680\`).
        3. **Social Proof & Logo Cloud**: "Trusted by over 10,000+ engineers at fast-growing startups" with clean logo placeholders.
        4. **Bento Feature Grid**: 3-column asymmetric layout highlighting core features, interactive hover states, micro-badges, and code/metric previews.
        5. **Interactive Metrics / KPI Counters**: Stats showing performance gains, uptime, and ROI.
        6. **Pricing Tiers**: Clean pricing cards (Starter, Pro, Enterprise) with feature checklist, "Most Popular" highlight badge, and monthly/annual billing toggle.
        7. **Interactive FAQ Accordion**: 4-5 key questions with working vanilla JavaScript click-to-expand accordion logic.
        8. **High-Conversion Bottom CTA Banner**: Ambient gradient background with final call-to-action and email capture form.
        9. **Multi-Column SaaS Footer**: Product links, company info, resources, legal, and copyright.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Agency Website') {
        return `
        You are an Executive Creative Director at a world-class digital design agency.
        Your job is to generate a bold, editorial, high-contrast digital agency website.

        ### ARCHITECTURE CONTEXT ###
        1. **Minimalist Editorial Navbar**: Clean brand mark, work index link, services dropdown, and "Let's Talk" button.
        2. **Bold Hero Statement**: Oversized display typography, provocative agency ethos statement, and a cinematic widescreen video/image banner overlay (\`https://picsum.photos/1200/600\`).
        3. **Selected Works & Case Studies**: Expansive case study cards featuring high-res imagery, client name, industry tags, deliverables badges, and interactive hover zoom.
        4. **Core Capabilities & Services**: Interactive service list (Brand Strategy, Digital Product Design, Web Development, Motion & 3D) with hover-revealed details.
        5. **Client Showcase & Testimonials**: Editorial quote cards with client portraits and agency awards summary (Awwwards, FWA, Red Dot).
        6. **Interactive Project Inquiry / Contact Form**: Modern budget selector, timeline options, and message input.
        7. **Editorial Footer**: Social channels, studio locations (New York, London, Tokyo), and copyright.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Product Showcase') {
        return `
        You are a Lead Industrial & D2C Product Designer at a premium consumer brand.
        Your job is to generate an immersive, scroll-driven product reveal landing page.

        ### ARCHITECTURE CONTEXT ###
        1. **Sticky Product Header**: Product name, quick navigation (Overview, Specs, Reviews), and sticky "Order Now" button.
        2. **Immersive Hero Reveal**: Giant product title, key value proposition, high-resolution edge-to-edge product shot placeholder (\`https://picsum.photos/1200/800\`), and price/preorder badge.
        3. **Key Benefits & Engineering Highlights**: Alternating image-and-copy sections highlighting premium materials, battery life, performance, and ergonomic craftsmanship.
        4. **Interactive Technical Specifications Table**: Clean tabular layout of technical dimensions, materials, connectivity, and package contents.
        5. **Customer Reviews & 5-Star Social Proof**: Verified buyer quotes, star rating breakdown, and user testimonial cards.
        6. **Sticky Buy / Guarantee Section**: 30-day money back guarantee, free worldwide shipping badge, and large CTA button.
        7. **Minimalist Brand Footer**: Warranty registration, support links, social icons, and copyright.

        ${baseData}
        ${universalRules}
        `;
    }

    // Default Fallback
    return `
        You are a World-Class Principal UI/UX Designer & Full-Stack Engineer. 
        Your job is to generate an ultra-modern, responsive website.

        ### ARCHITECTURE CONTEXT ###
        A comprehensive, semantic HTML5 layout with Navbar, Hero Section, Feature Grid, Testimonials, Interactive FAQ, Contact Section, and Footer.

        ${baseData}
        ${universalRules}
    `;
};

router.post('/generate', verifyToken, async (req, res) => {
    const { useCase, portfolioFormat, aesthetics, dynamicData, customInstructions } = req.body;

    if (!useCase || !aesthetics || !dynamicData) {
        return res.status(400).json({ error: 'Missing required architecture details.' });
    }

    const formattedDynamicContext = Object.entries(dynamicData)
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `- ${label}: ${value || '(User left this blank. Invent highly creative, premium professional content for this)'}`;
        })
        .join('\n');

    const prompt = getFineTunedPrompt(useCase, portfolioFormat, aesthetics, formattedDynamicContext, customInstructions);

    try {
        const result = await generateWithFallback(prompt);
        const textResponse = result.response.text();
        const parsedData = extractAndParseJSON(textResponse);
        
        res.status(200).json({ html: parsedData.html, css: parsedData.css });
    } catch (error) {
        require('fs').appendFileSync('ai-debug.log', new Date().toISOString() + ' GENERATE ERROR: ' + (error.stack || error) + '\n');
        console.error('AI Generation Error:', error.message || error);
        res.status(500).json({ error: 'Failed to generate website layout via AI.' });
    }
});

router.post('/edit', verifyToken, async (req, res) => {
    const { html, css, prompt: userPrompt } = req.body;

    if (!html || !css || !userPrompt) {
        return res.status(400).json({ error: 'Missing current canvas data or prompt.' });
    }

    const aiPrompt = `
        You are an elite AI Web Developer Co-pilot and Master Frontend Engineer.
        The user is editing their live website inside a visual drag-and-drop editor.
        They want to modify their existing website based on an instruction.

        ### SURGICAL EDITING INSTRUCTIONS ###
        1. **Precision Modification**: Modify ONLY what the user explicitly requested. Preserve all existing sections, IDs, classes, styles, scripts, and content that were NOT requested to change.
        2. **Aesthetic Consistency**: Maintain Vercel/Linear level aesthetics, CSS variables under \`#website-root\`, smooth cubic-bezier transitions, and high contrast.
        3. **Interactive Scripting**:
           - If the user asks for new interactivity (e.g., "Add a working dark/light toggle", "Add an FAQ accordion", "Make the contact form show a success message"), generate the necessary HTML structure, matching CSS styles, AND the vanilla JavaScript inside a \`<script>\` tag at the bottom of the HTML output.
           - If there are existing \`<script>\` tags, preserve them and append new functionality cleanly.
        4. **Complete Output**: Return the COMPLETE updated HTML (including all <script> tags) and the COMPLETE updated CSS.

        ### USER INSTRUCTION ###
        "${userPrompt}"

        ### CURRENT LIVE HTML ###
        ${html}

        ### CURRENT LIVE CSS ###
        ${css}

        ### REQUIRED OUTPUT FORMAT ###
        Return a single valid JSON object with EXACTLY two keys:
        {
          "html": "Complete updated HTML inside <div id=\\"website-root\\">...</div>, ending with functional <script> tags if applicable.",
          "css": "Complete updated CSS stylesheet targeting #website-root and classes."
        }
    `;

    try {
        const result = await generateWithFallback(aiPrompt);
        const textResponse = result.response.text();
        const parsedData = extractAndParseJSON(textResponse);
        
        res.status(200).json({ html: parsedData.html, css: parsedData.css });
    } catch (error) {
        require('fs').appendFileSync('ai-debug.log', new Date().toISOString() + ' EDIT ERROR: ' + (error.stack || error) + '\n');
        console.error('AI Edit Error:', error.message || error);
        res.status(500).json({ error: 'Failed to apply edits via AI.' });
    }
});

module.exports = router;
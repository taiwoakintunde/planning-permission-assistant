'use client';
import { useState, useEffect } from "react";

const STEPS = ["Project", "Property", "Location", "Generate"];

const PROJECT_TYPES = [
  { id: "rear_extension", label: "Rear extension" },
  { id: "side_extension", label: "Side extension" },
  { id: "loft_conversion", label: "Loft conversion" },
  { id: "outbuilding", label: "Outbuilding / shed / garden room" },
  { id: "porch", label: "Porch" },
  { id: "roof_alteration", label: "Roof alteration / dormer" },
  { id: "driveway", label: "Driveway / hardstanding" },
  { id: "fence_wall", label: "Fence or wall" },
];

const PROPERTY_TYPES = [
  { id: "detached", label: "Detached house" },
  { id: "semi", label: "Semi-detached house" },
  { id: "terraced", label: "Terraced house" },
  { id: "bungalow", label: "Bungalow" },
  { id: "flat", label: "Flat / apartment" },
];

const initialForm = {
  projectType: "",
  projectDescription: "",
  heightM: "",
  depthM: "",
  widthM: "",
  propertyType: "",
  postcode: "",
  conservationArea: false,
  listedBuilding: false,
  aonb: false,
  previousExtensions: false,
  email: "",
  discountCode: "",
};

const SYSTEM_PROMPT = `You are a senior UK planning consultant with expert knowledge of the Town and Country Planning (General Permitted Development) (England) Order 2015 (GPDO) as amended, the Town and Country Planning (General Permitted Development) Order 1995 (as amended for Wales), the Town and Country Planning Act 1990, the Planning Policy Framework (NPPF) for England, and Planning Policy Wales (PPW) Edition 12.

CRITICAL — DETECT JURISDICTION FROM POSTCODE:
- Wales postcodes: CF (Cardiff), NP (Newport/Gwent), SA (Swansea), LD (Powys), LL (North Wales), SY (parts), HR (parts), CH (parts of Flintshire)
- If postcode is Welsh: apply WELSH planning rules, reference Planning Policy Wales and Technical Advice Notes (TANs), NOT the GPDO or NPPF
- If postcode is English: apply ENGLISH rules (GPDO + NPPF)
- If unclear: note uncertainty and apply English rules as default

WELSH PERMITTED DEVELOPMENT RULES (key differences from England):
• Wales has its own permitted development order — The Town and Country Planning (General Permitted Development) Order 1995 as amended by Welsh statutory instruments
• Rear extensions: detached max 4m single-storey (NOT 8m like England); semi/terraced max 3m single-storey
• No prior approval / larger home extension scheme in Wales — the 4m/3m limits are absolute
• Householder permitted development rights were significantly amended in Wales by the 2013 and 2019 amendments
• Wales does NOT have the Neighbour Consultation Scheme (prior approval) that England introduced
• Solar panels: slightly different rules in Wales — permitted on roofs but conservation area restrictions apply
• Welsh Government policy: Planning Policy Wales (PPW) Edition 12, supported by Technical Advice Notes (TANs)
• TAN 8: renewable energy; TAN 12: design; TAN 15: development and flood risk (very important in Wales)
• Flood risk: Wales has extensive flood risk zones — always flag if near river valleys (NP postcodes near Usk/Wye, CF near Taff/Rhymney, SA near Swansea Bay)
• Listed buildings in Wales: Cadw (not Historic England) is the statutory consultee
• Always reference local authority Local Development Plan (LDP) rather than Local Plan for Welsh authorities
• Key Welsh LPAs: Cardiff Council, Newport City Council, Swansea Council, Monmouthshire CC, Caerphilly CBC, Vale of Glamorgan

Your job is to analyse a homeowner's proposed project and produce a comprehensive, accurate structured planning assessment. You MUST return your response as a valid JSON object with exactly this structure:

{
  "verdict": "permitted_development" | "prior_approval" | "planning_permission" | "likely_refused",
  "confidence": "high" | "medium" | "low",
  "summary": "2-3 sentence plain English summary of the verdict",
  "pdClass": "The relevant GPDO class (e.g. Class A, Class B, Class E) or null if not applicable",
  "keyRules": ["rule 1", "rule 2", "rule 3"],
  "priorApprovalDetails": null or { "required": true, "process": "description of the prior approval process", "neighbourConsultation": true or false, "consultationPeriod": "42 days" or null, "fee": "£120 (householder)" or relevant fee string, "determination": "56 days from valid application" },
  "cilAssessment": { "liable": true | false | "unknown", "reason": "explanation", "selfBuildExemption": true | false, "exemptionFormRequired": true | false },
  "planningStatement": "A full planning statement (400-600 words) written professionally, suitable for submission to a Local Planning Authority. Structure it with: (1) Description of Proposal, (2) Site and Surroundings, (3) Planning Policy Context citing relevant NPPF paragraphs, (4) Assessment against Development Plan policies, (5) Impact on Amenity and Character, (6) Conclusion. Use formal planning language.",
  "riskFlags": [
    { "level": "high" | "medium" | "low", "flag": "description of risk" }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "preAppAdvice": { "recommended": true | false, "reason": "why pre-app is or isn't needed", "typicalCost": "£100-£300 for householder pre-app at most councils" },
  "disclaimer": "This report is for guidance only and does not constitute professional planning advice. Always verify with your Local Planning Authority before commencing works."
}

═══════════════════════════════════════════
GPDO PERMITTED DEVELOPMENT RULES (ENGLAND)
═══════════════════════════════════════════

CLASS A — REAR EXTENSIONS (single and two-storey):
• Detached house: max 8m depth single-storey, max 3m depth two-storey
• Semi-detached or terraced: max 6m depth single-storey, max 3m depth two-storey
• Heights: max 4m to ridge for single-storey; eaves must not exceed 3m if within 2m of boundary; overall height must not exceed original dwellinghouse
• Must not extend beyond a wall forming a side elevation on the principal elevation side
• Must not result in more than half the area of the original curtilage (excluding the original house) being covered by buildings
• Materials must be similar in appearance to the existing dwelling
• No verandas, raised platforms or balconies

CLASS A — PRIOR APPROVAL (larger home extension scheme):
• Detached: between 4m–8m depth single-storey; between 3m–6m depth (not available for two-storey under prior approval — two-storey max is 3m regardless)
• Semi/terraced: between 3m–6m depth single-storey
• NEIGHBOUR CONSULTATION SCHEME: LPA must notify adjoining owners/occupiers; 21-day consultation period; if objection received from neighbour, LPA must assess impact on amenity; if no objection or LPA satisfied, prior approval granted
• LPA has 42 days to determine from receipt of valid application; if no decision in 42 days, prior approval deemed granted
• Fee: £120 (as of 2024)
• Must still comply with all other Class A conditions (height, materials, curtilage etc.)
• NOT available if: in a conservation area (for side walls), if a listed building, if Article 4 direction removes it

CLASS B — ROOF EXTENSIONS (adding roof space):
• Max additional roof space: 40m³ for terraced houses; 50m³ for detached and semi-detached
• No extension beyond the plane of the existing roof slope of the principal elevation facing a highway
• No extension to be higher than the highest part of the existing roof
• Side-facing windows must be obscure-glazed and non-opening below 1.7m from floor
• Must not overhang the outer face of the wall of the dwellinghouse
• Not permitted in conservation areas or on listed buildings

CLASS C — ROOF ALTERATIONS (rooflights, solar panels etc.):
• Rooflights: must not protrude more than 150mm from the roof plane; must not be on a principal elevation facing a highway in a conservation area
• Solar PV: permitted but must be sited to minimise effect on external appearance; removed when no longer needed

CLASS D — PORCHES:
• Ground area must not exceed 3m² (measured externally)
• Height must not exceed 3m
• Must not be within 2m of any boundary of the curtilage with a highway

CLASS E — OUTBUILDINGS, POOLS, ENCLOSURES:
• Must not be forward of the principal elevation or forward of a side elevation fronting a highway
• Max height: 4m with a dual-pitched roof; 3m in any other case; 2.5m if within 2m of a boundary
• In conservation areas: must not be on land between a wall forming a side elevation and the boundary of the curtilage
• Must not result in more than 50% of the curtilage (excluding original house footprint) being covered
• Purpose: incidental to enjoyment of the dwellinghouse (not a separate dwelling unit, no sleeping accommodation as primary use)

CLASS F — HARD SURFACES (driveways):
• Driveways of any size are permitted IF: surface is permeable (permeable paving, gravel, block paving with drainage) OR drainage directed to lawn/soakaway
• If surface is impermeable AND drains to highway: planning permission required for areas over 5m²
• Must not involve raising ground level within 3m of a highway

CLASS G — CHIMNEYS, FLUES, SOIL PIPES:
• Permitted subject to height limits (max 1m above highest part of roof if on principal elevation in conservation area)

FENCES, GATES AND WALLS (Part 2 Class A):
• Max 2m height generally
• Max 1m if adjacent to a highway used by vehicular traffic
• Not permitted if it would obstruct highway visibility
• Conservation areas: some councils have removed PD rights for fences

═══════════════════════════════════════════
DESIGNATION-SPECIFIC RULES
═══════════════════════════════════════════

CONSERVATION AREAS:
• Class A rear extensions: not permitted if the extension would be visible from a highway (includes side roads and footpaths)
• Cladding of exterior with stone, artificial stone, pebble dash, render, timber, plastic, or tiles requires planning permission
• Class B roof extensions: not permitted on principal elevation facing highway
• Class E outbuildings: not permitted between side wall and boundary if visible from highway
• Many conservation areas have Article 4 directions removing additional PD rights — always flag this
• Common in: parts of London, Bath, Chester, Cambridge, Oxford, York, Cheltenham, most historic town centres

LISTED BUILDINGS:
• ALL external works require Listed Building Consent (LBC) — there is no permitted development for listed buildings
• Even internal works affecting character require LBC
• Penalties for unauthorised works: criminal prosecution, enforcement notice, requirement to reinstate
• ALWAYS set verdict to "planning_permission" and flag as HIGH RISK

ARTICLE 4 DIRECTIONS:
• Councils can remove specific PD rights via Article 4 directions
• Very common in London boroughs — most London postcodes (E, EC, N, NW, SE, SW, W, WC, BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB, WD) have extensive Article 4 directions
• Also common in: Bristol city centre, Brighton, Bath, Edinburgh (Scotland has different rules entirely), Cambridge, Oxford
• Specific Article 4 directions vary enormously — always recommend checking with LPA
• If postcode is a London borough prefix, set confidence to "medium" maximum and flag Article 4 as HIGH risk

AREAS OF OUTSTANDING NATURAL BEAUTY (AONB) / NATIONAL PARKS:
• Class B roof extensions: NOT permitted
• Class E outbuildings over 10m² within 5m of dwelling: require planning permission
• Side extensions: NOT permitted under PD
• Two-storey extensions: NOT permitted under PD
• Restrictions on external cladding

═══════════════════════════════════════════
COMMUNITY INFRASTRUCTURE LEVY (CIL)
═══════════════════════════════════════════

CIL is a planning charge levied by some (not all) local authorities on new development that creates additional floorspace.

WHEN CIL APPLIES TO HOUSEHOLDER DEVELOPMENT:
• CIL is charged when net new internal floor area of 100m² or more is created, OR when a new dwelling is created
• Most standard householder extensions (rear extensions, loft conversions, outbuildings) are BELOW 100m² and therefore NOT liable for CIL
• Exception: very large extensions over 100m² net new floor area may be CIL liable
• Converting a garage or outbuilding into habitable space: check if this creates CIL liability

SELF-BUILD EXEMPTION:
• Homeowners who build their own home (or major extension) may claim self-build CIL exemption
• Must submit Form 7 (Self Build Exemption Claim) BEFORE commencing development
• If you start works without claiming exemption first, you lose the right to claim it — full CIL becomes payable immediately
• Exemption applies to: self-build new dwellings; self-build extensions and annexes (whole of dwelling must be self-build)
• IMPORTANT: "Self-build" in CIL context means the homeowner is commissioning the build for their own occupation — it does NOT require you to physically build it yourself

WHICH COUNCILS CHARGE CIL:
• Not all councils have adopted a CIL charging schedule — many still rely solely on S106 agreements
• London Mayoral CIL (MCIL2) applies across all London boroughs: currently £25/m² (Zone 1), £20/m² (Zone 2), £0 (Zone 3) — most residential is Zone 3
• Councils with CIL include: many London boroughs, Bristol, Brighton, Cambridge, Oxford, Guildford, and others
• Always recommend checking the specific council's CIL charging schedule at their planning portal

CIL PROCESS IF LIABLE:
1. Submit CIL Additional Information Form with planning application
2. LPA issues Liability Notice after permission granted
3. Submit Commencement Notice before starting works (failure = surcharge)
4. Pay CIL by the date in the Demand Notice (usually in instalments for large amounts)
5. Failure to pay: enforcement, stop notice, surcharge of 20% or £2,500 (whichever is greater)

═══════════════════════════════════════════
COUNCIL POLICY CONTEXT (NPPF)
═══════════════════════════════════════════

When writing the planning statement, reference these NPPF policies where relevant:

NPPF PARAGRAPH 130 (formerly 127): Good design — development should add to the overall quality of the area, respond to local character, and create safe environments.

NPPF PARAGRAPH 135 (formerly 131): Design quality — permission should be refused for development of poor design that fails to take the opportunities available for improving the character and quality of an area.

NPPF PARAGRAPH 124: Good design is a key aspect of sustainable development.

COMMON LOCAL POLICY THEMES (vary by council — reference generically):
• Residential extensions policies typically require: no unacceptable loss of light or privacy to neighbours; extension subordinate to original dwelling; no harm to street scene; materials to match; no over-development of plot
• The "45-degree rule" (or "25-degree" in some councils): a line drawn at 45 degrees from the nearest window of a neighbouring habitable room should not be crossed by the extension. If it would be crossed, council may refuse on amenity grounds.
• Overlooking: windows on side elevations within 1m of boundary should be obscure-glazed; windows overlooking neighbours' private amenity space are a common reason for refusal
• Overshadowing: BRE guidelines on daylight/sunlight — 25 degree angle from neighbour's ground floor window sill; VSC (Vertical Sky Component) loss of more than 20% is material

LONDON SPECIFIC:
• London Plan Policy D3 (Optimising Site Capacity): development should make the best use of land
• London Plan Policy D4 (Delivering Good Design): all development should achieve the highest standards
• Most London boroughs have Supplementary Planning Documents (SPDs) on householder extensions — reference this in the statement

═══════════════════════════════════════════
ASSESSMENT LOGIC
═══════════════════════════════════════════

Follow this decision tree:

1. Is it a listed building? → verdict: planning_permission, HIGH confidence, HIGH risk flag
2. Is it in an AONB/National Park with restricted works (side extension, 2-storey, large outbuilding)? → planning_permission
3. Is depth/size within FULL PD limits (not just prior approval band)? → permitted_development
4. Is depth within the PRIOR APPROVAL band (4-8m detached, 3-6m semi/terraced single-storey)? → prior_approval with full neighbour consultation details
5. Does it exceed all PD limits? → planning_permission
6. Conservation area restrictions triggered? → downgrade verdict or add high risk flag
7. London postcode? → add high risk flag for Article 4, reduce confidence
8. Is net new floor area likely ≥ 100m²? → add CIL liability flag
9. Is net new floor area < 100m² and homeowner self-building? → note self-build exemption available, flag Form 7 requirement

Always be specific about which dimension or rule triggers each verdict. Vague answers are unhelpful.

Return ONLY the JSON object. No markdown, no explanation, no preamble.`;

function buildUserPrompt(form) {
  const projectLabel = PROJECT_TYPES.find(p => p.id === form.projectType)?.label || form.projectType;
  const propertyLabel = PROPERTY_TYPES.find(p => p.id === form.propertyType)?.label || form.propertyType;

  return `Please assess this proposed project:

PROJECT TYPE: ${projectLabel}
DESCRIPTION: ${form.projectDescription || "Not provided"}
DIMENSIONS: ${form.depthM ? `Depth: ${form.depthM}m` : ""} ${form.widthM ? `Width: ${form.widthM}m` : ""} ${form.heightM ? `Height: ${form.heightM}m` : ""}
PROPERTY TYPE: ${propertyLabel}
POSTCODE: ${form.postcode}
CONSTRAINTS:
- Conservation area: ${form.conservationArea ? "YES" : "No"}
- Listed building: ${form.listedBuilding ? "YES" : "No"}
- AONB / National Park: ${form.aonb ? "YES" : "No"}
- Previous extensions already carried out: ${form.previousExtensions ? "YES" : "No"}

Generate the planning assessment JSON.`;
}

const verdictConfig = {
  permitted_development: { label: "Permitted Development", color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  prior_approval: { label: "Prior Approval Required", color: "#d97706", bg: "#fef3c7", icon: "⚠" },
  planning_permission: { label: "Planning Permission Required", color: "#2563eb", bg: "#dbeafe", icon: "i" },
  likely_refused: { label: "Likely to be Refused", color: "#dc2626", bg: "#fee2e2", icon: "✗" },
};

const riskColor = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };

export default function PlanningApp() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [paying, setPaying] = useState(false);

  // Check if returning from Stripe payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "true") {
      const saved = sessionStorage.getItem("planningForm");
      if (saved) {
        const savedForm = JSON.parse(saved);
        setForm(savedForm);
        setStep(3);
        setTimeout(() => generateReport(savedForm), 500);
      }
    }
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.projectType;
    if (step === 1) return form.propertyType;
    if (step === 2) return form.postcode.length >= 3;
    return true;
  };

  const generateReport = async (formData = form) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(formData) }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (e) {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Could not parse response");
        }
      }
      setReport(parsed);
      setStep(4);
      sessionStorage.removeItem("planningForm");

      // Send email report if email provided
      if (formData.email) {
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, report: parsed, form: formData }),
        }).catch(e => console.error("Email send failed:", e));
      }
    } catch (e) {
      setError("Something went wrong: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    setError(null);
    try {
      sessionStorage.setItem("planningForm", JSON.stringify(form));

      const endpoint = form.discountCode ? "/api/discount" : "/api/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: form,
          code: form.discountCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      setError("Payment failed: " + e.message);
      setPaying(false);
    }
  };

  const generate = handlePayment;

  const vc = report ? (verdictConfig[report.verdict] || verdictConfig.planning_permission) : null;

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        .pa-wrap { font-family: 'Source Serif 4', Georgia, serif; }
        .pa-title { font-family: 'Playfair Display', Georgia, serif; font-size: 2rem; font-weight: 700; color: #1a1a1a; margin: 0 0 .25rem; letter-spacing: -0.02em; }
        .pa-sub { font-size: .95rem; color: #666; margin: 0 0 2rem; font-weight: 300; font-style: italic; }
        .pa-steps { display: flex; gap: 0; margin-bottom: 2rem; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; }
        .pa-step { flex: 1; padding: .6rem; text-align: center; font-size: .78rem; font-family: 'Source Serif 4', serif; color: #999; background: #fafafa; border-right: 1px solid #e5e5e5; transition: all .2s; }
        .pa-step:last-child { border-right: none; }
        .pa-step.active { background: #1a1a1a; color: #fff; font-weight: 600; }
        .pa-step.done { background: #f0f7f0; color: #16a34a; }
        .pa-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.75rem; margin-bottom: 1.25rem; }
        .pa-label { display: block; font-size: .8rem; font-weight: 600; color: #555; margin-bottom: .5rem; text-transform: uppercase; letter-spacing: .06em; font-family: 'Source Serif 4', serif; }
        .pa-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
        @media (max-width: 480px) { .pa-grid { grid-template-columns: 1fr; } }
        .pa-option { border: 1.5px solid #e0e0e0; border-radius: 6px; padding: .75rem 1rem; cursor: pointer; font-size: .9rem; color: #333; background: #fff; transition: all .15s; text-align: left; font-family: 'Source Serif 4', serif; }
        .pa-option:hover { border-color: #888; }
        .pa-option.sel { border-color: #1a1a1a; background: #1a1a1a; color: #fff; }
        .pa-input { width: 100%; border: 1.5px solid #e0e0e0; border-radius: 6px; padding: .65rem .9rem; font-size: .95rem; font-family: 'Source Serif 4', serif; color: #1a1a1a; outline: none; transition: border-color .15s; }
        .pa-input:focus { border-color: #1a1a1a; }
        .pa-textarea { resize: vertical; min-height: 90px; }
        .pa-row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
        .pa-check { display: flex; align-items: center; gap: .6rem; cursor: pointer; padding: .65rem .9rem; border: 1.5px solid #e0e0e0; border-radius: 6px; transition: all .15s; }
        .pa-check:hover { border-color: #888; }
        .pa-check.sel { border-color: #1a1a1a; background: #f8f8f8; }
        .pa-check input { accent-color: #1a1a1a; width: 16px; height: 16px; cursor: pointer; }
        .pa-check span { font-size: .9rem; font-family: 'Source Serif 4', serif; color: #333; }
        .pa-btn { background: #1a1a1a; color: #fff; border: none; border-radius: 6px; padding: .8rem 2rem; font-size: .95rem; font-family: 'Source Serif 4', serif; cursor: pointer; transition: opacity .15s; }
        .pa-btn:hover { opacity: .85; }
        .pa-btn:disabled { opacity: .4; cursor: not-allowed; }
        .pa-btn-ghost { background: transparent; color: #666; border: 1.5px solid #ddd; border-radius: 6px; padding: .75rem 1.5rem; font-size: .9rem; font-family: 'Source Serif 4', serif; cursor: pointer; }
        .pa-btn-ghost:hover { border-color: #999; color: #333; }
        .pa-navrow { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; }
        .pa-section-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin: 0 0 1rem; }
        .pa-verdict { border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; }
        .pa-verdict-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; flex-shrink: 0; color: #fff; }
        .pa-verdict-body h3 { margin: 0 0 .3rem; font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; }
        .pa-verdict-body p { margin: 0; font-size: .9rem; line-height: 1.6; color: #444; }
        .pa-tabs { display: flex; gap: 0; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; margin-bottom: 1.25rem; }
        .pa-tab { flex: 1; padding: .6rem; text-align: center; font-size: .82rem; font-family: 'Source Serif 4', serif; cursor: pointer; background: #fafafa; color: #888; border-right: 1px solid #e5e5e5; transition: all .15s; }
        .pa-tab:last-child { border-right: none; }
        .pa-tab.active { background: #1a1a1a; color: #fff; font-weight: 600; }
        .pa-rules li, .pa-steps-list li { font-size: .9rem; color: #444; margin-bottom: .6rem; line-height: 1.6; padding-left: .5rem; }
        .pa-risk { display: flex; align-items: flex-start; gap: .75rem; padding: .75rem; border-radius: 6px; background: #fafafa; border: 1px solid #eee; margin-bottom: .6rem; }
        .pa-risk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
        .pa-risk p { margin: 0; font-size: .88rem; line-height: 1.5; color: #444; }
        .pa-statement { font-size: .9rem; line-height: 1.8; color: #333; white-space: pre-wrap; }
        .pa-disclaimer { font-size: .78rem; color: #999; font-style: italic; border-top: 1px solid #eee; padding-top: 1rem; margin-top: 1rem; line-height: 1.6; }
        .pa-loading { text-align: center; padding: 3rem 1rem; }
        .pa-spinner { width: 36px; height: 36px; border: 2.5px solid #e0e0e0; border-top-color: #1a1a1a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.25rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pa-loading h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a1a1a; margin: 0 0 .4rem; }
        .pa-loading p { font-size: .88rem; color: #888; margin: 0; font-style: italic; }
        .pa-conf { font-size: .78rem; color: #888; text-transform: uppercase; letter-spacing: .06em; margin-top: .4rem; }
        .pa-badge { display: inline-block; font-size: .75rem; padding: .25rem .65rem; border-radius: 20px; font-weight: 600; font-family: 'Source Serif 4', serif; }
      `}</style>

      <div className="pa-wrap">
        <p className="pa-title">Planning Permission Assistant</p>
        <p className="pa-sub">Instant UK planning guidance — powered by AI, grounded in the GPDO</p>

        {step < 4 && (
          <div className="pa-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`pa-step ${i === step ? "active" : i < step ? "done" : ""}`}>{s}</div>
            ))}
          </div>
        )}

        {/* STEP 0: Project type */}
        {step === 0 && (
          <div className="pa-card">
            <p className="pa-section-title">What are you planning to build?</p>
            <div className="pa-grid" style={{ marginBottom: "1.25rem" }}>
              {PROJECT_TYPES.map(p => (
                <button key={p.id} className={`pa-option ${form.projectType === p.id ? "sel" : ""}`} onClick={() => set("projectType", p.id)}>{p.label}</button>
              ))}
            </div>
            <label className="pa-label">Briefly describe your project (optional)</label>
            <textarea className="pa-input pa-textarea" placeholder="e.g. Single-storey rear extension, 4m deep, flat roof, to create open-plan kitchen-diner..." value={form.projectDescription} onChange={e => set("projectDescription", e.target.value)} />
            <div className="pa-navrow">
              <span />
              <button className="pa-btn" disabled={!canNext()} onClick={() => setStep(1)}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 1: Property */}
        {step === 1 && (
          <div className="pa-card">
            <p className="pa-section-title">Tell us about your property</p>
            <label className="pa-label" style={{ marginBottom: ".75rem", display: "block" }}>Property type</label>
            <div className="pa-grid" style={{ marginBottom: "1.25rem" }}>
              {PROPERTY_TYPES.map(p => (
                <button key={p.id} className={`pa-option ${form.propertyType === p.id ? "sel" : ""}`} onClick={() => set("propertyType", p.id)}>{p.label}</button>
              ))}
            </div>
            <label className="pa-label">Dimensions (metres) — fill in what you know</label>
            <div className="pa-row3" style={{ marginBottom: "1.25rem" }}>
              <div><label className="pa-label" style={{ fontSize: ".75rem" }}>Depth</label><input className="pa-input" type="number" placeholder="e.g. 4" value={form.depthM} onChange={e => set("depthM", e.target.value)} /></div>
              <div><label className="pa-label" style={{ fontSize: ".75rem" }}>Width</label><input className="pa-input" type="number" placeholder="e.g. 6" value={form.widthM} onChange={e => set("widthM", e.target.value)} /></div>
              <div><label className="pa-label" style={{ fontSize: ".75rem" }}>Height</label><input className="pa-input" type="number" placeholder="e.g. 3" value={form.heightM} onChange={e => set("heightM", e.target.value)} /></div>
            </div>
            <label className="pa-label">Constraints — tick all that apply</label>
            <div className="pa-grid">
              {[
                ["conservationArea", "Conservation area"],
                ["listedBuilding", "Listed building"],
                ["aonb", "AONB or National Park"],
                ["previousExtensions", "Extensions already built"],
              ].map(([key, label]) => (
                <label key={key} className={`pa-check ${form[key] ? "sel" : ""}`}>
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="pa-navrow">
              <button className="pa-btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="pa-btn" disabled={!canNext()} onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div className="pa-card">
            <p className="pa-section-title">Where is the property?</p>
            <label className="pa-label">Postcode</label>
            <input className="pa-input" style={{ marginBottom: "1.5rem", maxWidth: 200 }} placeholder="e.g. SW1A 1AA" value={form.postcode} onChange={e => set("postcode", e.target.value.toUpperCase())} />
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: ".9rem 1rem", fontSize: ".85rem", color: "#92400e", lineHeight: 1.6 }}>
              <strong>Why we need this:</strong> Planning rules vary significantly by location. London boroughs frequently have Article 4 directions removing standard permitted development rights. Conservation area boundaries and AONB designations are location-specific.
            </div>
            <div className="pa-navrow">
              <button className="pa-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="pa-btn" disabled={!canNext()} onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Review + generate */}
        {step === 3 && (
          <div className="pa-card">
            <p className="pa-section-title">Review your details</p>
            {[
              ["Project", PROJECT_TYPES.find(p => p.id === form.projectType)?.label],
              ["Property", PROPERTY_TYPES.find(p => p.id === form.propertyType)?.label],
              ["Postcode", form.postcode],
              ["Dimensions", [form.depthM && `${form.depthM}m deep`, form.widthM && `${form.widthM}m wide`, form.heightM && `${form.heightM}m high`].filter(Boolean).join(" · ") || "Not specified"],
              ["Constraints", [form.conservationArea && "Conservation area", form.listedBuilding && "Listed building", form.aonb && "AONB", form.previousExtensions && "Prior extensions"].filter(Boolean).join(", ") || "None flagged"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: ".75rem", padding: ".65rem 0", borderBottom: "1px solid #f0f0f0", fontSize: ".9rem" }}>
                <span style={{ width: 110, color: "#888", flexShrink: 0 }}>{k}</span>
                <span style={{ color: "#1a1a1a" }}>{v}</span>
              </div>
            ))}
            {form.projectDescription && (
              <div style={{ display: "flex", gap: ".75rem", padding: ".65rem 0", fontSize: ".9rem" }}>
                <span style={{ width: 110, color: "#888", flexShrink: 0 }}>Description</span>
                <span style={{ color: "#444", fontStyle: "italic" }}>{form.projectDescription}</span>
              </div>
            )}
            {error && <div style={{ marginTop: "1rem", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: ".75rem 1rem", fontSize: ".85rem", color: "#b91c1c" }}>{error}</div>}

            <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f0f0f0", paddingTop: "1.25rem" }}>
              <label className="pa-label">Email address — get your report by email</label>
              <input className="pa-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} style={{ marginBottom: ".75rem" }} />
              <label className="pa-label">Discount code (optional)</label>
              <input className="pa-input" type="text" placeholder="e.g. LAUNCH50" value={form.discountCode} onChange={e => set("discountCode", e.target.value.toUpperCase())} style={{ maxWidth: 200 }} />
            </div>

            <div className="pa-navrow">
              <button className="pa-btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <div style={{ textAlign: "right" }}>
                <button className="pa-btn" onClick={generate} disabled={loading || paying} style={{ fontSize: "1rem", padding: ".9rem 2rem" }}>
                  {paying ? "Redirecting to payment…" : "Get My Report — £19 →"}
                </button>
                <p style={{ margin: ".4rem 0 0", fontSize: ".75rem", color: "#999" }}>Secure payment via Stripe · Instant report</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="pa-loading">
            <div className="pa-spinner" />
            <h3>Analysing your project…</h3>
            <p>Checking GPDO rules, prior approval thresholds, CIL liability, and conservation constraints</p>
          </div>
        )}

        {/* REPORT */}
        {step === 4 && report && !loading && (
          <>
            <div className="pa-verdict" style={{ background: vc.bg }}>
              <div className="pa-verdict-icon" style={{ background: vc.color }}>{vc.icon}</div>
              <div className="pa-verdict-body">
                <h3 style={{ color: vc.color }}>{vc.label}</h3>
                {report.pdClass && <p className="pa-conf">GPDO {report.pdClass} · Confidence: {report.confidence}</p>}
                <p style={{ marginTop: ".4rem" }}>{report.summary}</p>
              </div>
            </div>

            <div className="pa-tabs">
              {[
                ["summary", "Key Rules"],
                ["prior", "Prior Approval"],
                ["cil", "CIL"],
                ["statement", "Statement"],
                ["risks", "Risks"],
                ["next", "Next Steps"],
              ].map(([id, label]) => (
                <div key={id} className={`pa-tab ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>{label}</div>
              ))}
            </div>

            <div className="pa-card">
              {activeTab === "summary" && (
                <>
                  <p className="pa-section-title">Key planning rules that apply</p>
                  <ul className="pa-rules" style={{ paddingLeft: "1.2rem" }}>
                    {report.keyRules?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {report.preAppAdvice && (
                    <div style={{ marginTop: "1.25rem", background: report.preAppAdvice.recommended ? "#fffbeb" : "#f0fdf4", border: `1px solid ${report.preAppAdvice.recommended ? "#fde68a" : "#bbf7d0"}`, borderRadius: 6, padding: ".9rem 1rem" }}>
                      <p style={{ margin: "0 0 .3rem", fontSize: ".82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: report.preAppAdvice.recommended ? "#92400e" : "#166534" }}>Pre-application advice</p>
                      <p style={{ margin: "0 0 .25rem", fontSize: ".88rem", color: "#444", lineHeight: 1.6 }}>{report.preAppAdvice.reason}</p>
                      {report.preAppAdvice.recommended && <p style={{ margin: 0, fontSize: ".82rem", color: "#666", fontStyle: "italic" }}>Typical cost: {report.preAppAdvice.typicalCost}</p>}
                    </div>
                  )}
                </>
              )}

              {activeTab === "prior" && (
                <>
                  <p className="pa-section-title">Prior approval</p>
                  {report.priorApprovalDetails ? (
                    report.priorApprovalDetails.required ? (
                      <>
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "1rem", marginBottom: "1.25rem" }}>
                          <p style={{ margin: "0 0 .4rem", fontSize: ".9rem", fontWeight: 600, color: "#92400e" }}>Prior approval required for this project</p>
                          <p style={{ margin: 0, fontSize: ".88rem", color: "#78350f", lineHeight: 1.6 }}>{report.priorApprovalDetails.process}</p>
                        </div>
                        {[
                          ["Neighbour consultation", report.priorApprovalDetails.neighbourConsultation ? "Yes — adjoining owners/occupiers will be notified by the LPA" : "Not required for this application type"],
                          ["Consultation period", report.priorApprovalDetails.consultationPeriod || "21 days from notification"],
                          ["Application fee", report.priorApprovalDetails.fee || "£120 (householder)"],
                          ["LPA determination period", report.priorApprovalDetails.determination || "42 days from valid application"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", gap: ".75rem", padding: ".6rem 0", borderBottom: "1px solid #f0f0f0", fontSize: ".88rem" }}>
                            <span style={{ width: 200, color: "#888", flexShrink: 0 }}>{k}</span>
                            <span style={{ color: "#333" }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: "1rem", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: ".85rem 1rem", fontSize: ".83rem", color: "#075985", lineHeight: 1.6 }}>
                          <strong>Important:</strong> If the LPA receives no objection from neighbours and the proposal meets all Class A conditions, prior approval must be granted. If the LPA does not determine the application within 42 days of a valid submission, prior approval is <em>deemed granted</em>.
                        </div>
                      </>
                    ) : (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "1rem" }}>
                        <p style={{ margin: 0, fontSize: ".9rem", color: "#166534" }}>Prior approval is <strong>not required</strong> for this project. Your proposal either falls within the standard permitted development limits or requires full planning permission — see the Key Rules tab for details.</p>
                      </div>
                    )
                  ) : (
                    <p style={{ color: "#888", fontSize: ".9rem" }}>Prior approval information not applicable to this project type.</p>
                  )}
                </>
              )}

              {activeTab === "cil" && (
                <>
                  <p className="pa-section-title">Community Infrastructure Levy (CIL)</p>
                  {report.cilAssessment ? (
                    <>
                      <div style={{
                        background: report.cilAssessment.liable === true ? "#fff7ed" : report.cilAssessment.liable === false ? "#f0fdf4" : "#f8f8f8",
                        border: `1px solid ${report.cilAssessment.liable === true ? "#fed7aa" : report.cilAssessment.liable === false ? "#bbf7d0" : "#e5e5e5"}`,
                        borderRadius: 6, padding: "1rem", marginBottom: "1.25rem"
                      }}>
                        <p style={{ margin: "0 0 .3rem", fontSize: ".88rem", fontWeight: 600, color: report.cilAssessment.liable === true ? "#c2410c" : report.cilAssessment.liable === false ? "#166534" : "#555" }}>
                          CIL liability: {report.cilAssessment.liable === true ? "Potentially liable" : report.cilAssessment.liable === false ? "Not liable" : "Unknown — check with LPA"}
                        </p>
                        <p style={{ margin: 0, fontSize: ".88rem", color: "#555", lineHeight: 1.6 }}>{report.cilAssessment.reason}</p>
                      </div>
                      {report.cilAssessment.selfBuildExemption && (
                        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: ".9rem 1rem", marginBottom: "1rem" }}>
                          <p style={{ margin: "0 0 .3rem", fontSize: ".82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#075985" }}>Self-build CIL exemption available</p>
                          <p style={{ margin: 0, fontSize: ".87rem", color: "#0c4a6e", lineHeight: 1.6 }}>
                            You may be eligible to claim a self-build exemption from CIL.
                            {report.cilAssessment.exemptionFormRequired && <> You <strong>must submit Form 7 (Self Build Exemption Claim) BEFORE commencing any works</strong>. If you start works without claiming, the exemption is lost and full CIL becomes immediately payable.</>}
                          </p>
                        </div>
                      )}
                      <div style={{ fontSize: ".82rem", color: "#888", lineHeight: 1.7, fontStyle: "italic", borderTop: "1px solid #f0f0f0", paddingTop: ".9rem", marginTop: ".5rem" }}>
                        Not all councils have adopted a CIL charging schedule. Check your council's planning portal for their current CIL charging schedule and any exemptions that may apply to your project.
                      </div>
                    </>
                  ) : (
                    <p style={{ color: "#888", fontSize: ".9rem" }}>CIL assessment not available for this project.</p>
                  )}
                </>
              )}

              {activeTab === "statement" && (
                <>
                  <p className="pa-section-title">Planning Statement</p>
                  <p style={{ fontSize: ".8rem", color: "#888", marginBottom: "1rem", fontStyle: "italic" }}>Suitable for submission to your Local Planning Authority · Cites NPPF policy</p>
                  <p className="pa-statement">{report.planningStatement}</p>
                  <button className="pa-btn" style={{ marginTop: "1.25rem", fontSize: ".85rem", padding: ".65rem 1.5rem" }} onClick={() => {
                    const blob = new Blob([`PLANNING STATEMENT\n${"=".repeat(60)}\n\nProject: ${PROJECT_TYPES.find(p => p.id === form.projectType)?.label}\nProperty: ${form.postcode}\nDate: ${new Date().toLocaleDateString("en-GB")}\n\n${report.planningStatement}\n\n${"=".repeat(60)}\n${report.disclaimer}`], { type: "text/plain" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "planning-statement.txt"; a.click();
                  }}>Download Statement</button>
                </>
              )}

              {activeTab === "risks" && (
                <>
                  <p className="pa-section-title">Risk flags</p>
                  {report.riskFlags?.length > 0 ? report.riskFlags.map((r, i) => (
                    <div key={i} className="pa-risk">
                      <div className="pa-risk-dot" style={{ background: riskColor[r.level] || "#888" }} />
                      <div>
                        <span className="pa-badge" style={{ background: r.level === "high" ? "#fee2e2" : r.level === "medium" ? "#fef3c7" : "#dcfce7", color: riskColor[r.level], marginBottom: ".3rem" }}>{r.level} risk</span>
                        <p>{r.flag}</p>
                      </div>
                    </div>
                  )) : <p style={{ color: "#888", fontSize: ".9rem" }}>No significant risk flags identified.</p>}
                </>
              )}

              {activeTab === "next" && (
                <>
                  <p className="pa-section-title">Recommended next steps</p>
                  <ol className="pa-steps-list" style={{ paddingLeft: "1.5rem" }}>
                    {report.nextSteps?.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </>
              )}

              <p className="pa-disclaimer">{report.disclaimer}</p>
            </div>

            <div style={{ background: "#f8f8f8", border: "1px solid #e5e5e5", borderRadius: 8, padding: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 .4rem", fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#1a1a1a" }}>Want a professional to review this?</p>
              <p style={{ margin: "0 0 1rem", fontSize: ".85rem", color: "#666", lineHeight: 1.6 }}>Get a 30-minute call with an RTPI-accredited planning consultant who knows your local council.</p>
              <a href="https://www.rtpi.org.uk/find-a-planner/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#1a1a1a", color: "#fff", padding: ".7rem 1.5rem", borderRadius: 6, fontSize: ".88rem", textDecoration: "none", fontFamily: "'Source Serif 4', serif" }}>Find a Planning Consultant →</a>
              <p style={{ margin: ".75rem 0 0", fontSize: ".75rem", color: "#999" }}>Powered by the Royal Town Planning Institute</p>
            </div>

            <button className="pa-btn-ghost" style={{ width: "100%", marginTop: ".5rem" }} onClick={() => { setReport(null); setForm(initialForm); setStep(0); setActiveTab("summary"); }}>
              Start a new assessment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

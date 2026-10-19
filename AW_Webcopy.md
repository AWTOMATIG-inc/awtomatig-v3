# AWTOMATIG Webcopy Plan

What every page says today, and what should replace it for search. Nothing in the site has been changed. Apply this file after the other tasks are done.

**10**sections, covering every route

**53**copy changes proposed

**56**items reviewed and kept

**2**items need real content or a consistency fix

### How the copy was written

- **Market:** global, service keywords: business automation, ERP implementation, back-office operations, website development, AdTech operations, workflow automation.
- **Length:** every layout-bound change stays within ±5% of the current character count, with the same number of forced line breaks (↵) and no line longer than today’s longest by more than 6%. Strings under 30 characters may differ by 2, buttons by 4. A script checked this, not the eye.
- **Meta tags** are not layout-bound, so they follow Google’s limits instead: title up to 60 characters including “ | AWTOMATIG”, description 120 to 160. Alt text up to 125.
- **Style (antislop):** plain words, no em dashes, no buzzwords (seamless, powerful, effortless), no generic CTAs (Explore, Learn more), no new claims or numbers. Brand headlines stay where a keyword would not improve them.
- **Kept on purpose:** the four service names, the nav labels and the process step names. They are reused in the nav, footer, filters and form, so changing them is a site-wide rename, not a copy edit.

### Before you apply this

- **Placeholder content is not SEO content.** The testimonials (“Client Name goes here”), team names and photos, XX+ stats and the three copies of the Snaillia case study should be replaced with real material before the pages are indexed. Do not add Review or Person schema for them.
- **Unverified numbers:** 35+ / 50+ / 120+ / 75+ (Trusted operations), the 4.8 rating badges and “Typically within 1 business day” are claims. Confirm each is true.
- **Case study meta:** the detail page uses the card summary as its meta description. Add a separate `seoTitle` and `seoDescription` to each study in `caseStudies.ts`.
- **Where each edit lives:** meta in `app/(site)/**/page.tsx` and `lib/site.ts`; hero and section text in `app/components/sections/**`; tags in `CAPABILITY_TAGS`; image alt in `services.ts`.
- **After applying:** run `npm run format`, `npm run build` and `npm run lint`, then check each changed heading at 1440, 1024 and 390 wide.

[Site-wide](#global)[Home](#home)[Services](#services)[Case Studies](#case-studies)[Case study detail](#case-detail)[About](#about)[Process](#process)[Contact](#contact)[Privacy Policy and Terms](#legal)[404 page](#404)

## Site-wide `all pages`

Header, footer and the shared defaults. The title template in app/layout.tsx adds “ | AWTOMATIG” (12 chars) to every inner page title, so inner titles below are written without it.

WhereCurrently writtenReplace withChars

**Header**  
Nav linksHome · Services · Case Studies · About · ContactShort labels are the right call for nav. Keep. Process stays footer-only.Keep

**Footer**  
StatementConnecting the systems that keep business moving.Keep. Clean, 8em wrap is tuned to this length.Keep

**Footer**  
Intro paragraphWe help businesses build, connect and operate the systems behind growth from digital infrastructure and back-office operations to ERP and AdTech.

We help businesses build, connect and run the systems behind growth, from website infrastructure and back-office operations to ERP and AdTech.

Fixes the missing comma after “growth”. “Website infrastructure” matches the service name.

145 → 142  
\-2.1%Change

**Footer**  
Button labelsStart a conversation · Message us · Email us · NewsletterSpecific and short. Keep.Keep

**Footer**  
Column labels / linksPages · Services · ElsewhereService links already use the exact service names, which helps internal-link anchor text. Keep.Keep

**Site config**  
Organization JSON-LD description (SITE.description)AWTOMATIG builds websites, back-office operations, ERP systems and AdTech workflows, connected into one scalable operational ecosystem.

AWTOMATIG builds websites, runs back-office operations, implements ERP systems and manages AdTech workflows as one connected business system.

Same string feeds Home meta, Open Graph, Twitter and JSON-LD. Change it once in lib/site.ts.

135 → 141  
+4.4%  
limit 160Change

## Home `/`

H1 and the hero paragraph carry the main keywords (business automation, ERP, back-office operations, AdTech). Everything inside the stacking service cards keeps its titles, because they are the service names used in the nav, footer and filters.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagAWTOMATIG: The operational layer behind modern businesses

AWTOMATIG: Business Automation, ERP &amp; Back-Office Systems

57 → 57  
+0.0%  
57 with brand · limit 60Change

**Meta**  
Meta descriptionAWTOMATIG builds websites, back-office operations, ERP systems and AdTech workflows, connected into one scalable operational ecosystem.

AWTOMATIG builds websites, runs back-office operations, implements ERP systems and manages AdTech workflows as one connected business system.

135 → 141  
+4.4%  
limit 160Change

**Hero**  
EyebrowBuild the systems.

Business automation.

Puts the head keyword in the first text a crawler sees.

18 → 20  
+11.1%Change

**Hero**  
H1The operational↵layer behind modern↵businesses.

The automation↵layer behind modern↵businesses.

Keeps the 3-line display wrap and the brand’s “layer behind” idea. Swaps “operational” for the searchable “automation”.

47 → 46  
\-2.1%  
3 lines keptChange

**Hero**  
ParagraphFrom websites and back-office operations to ERP systems, automation,↵and AdTech workflows, AWTOMATIG connects people, process, systems,↵and technology into one scalable ecosystem.

From websites and back-office operations to ERP systems, workflow↵automation and AdTech, AWTOMATIG connects people, process, systems↵and technology into one scalable business system.

179 → 182  
+1.7%  
3 lines keptChange

**Hero**  
Primary buttonExplore Our Services

View Our Services

“Explore” is a generic CTA.

20 → 17  
\-15.0%Change

**Hero**  
Secondary buttonStart a ConversationFine. Keep.Keep

**Hero**  
Strip titleBuilt for the systems behind the business.

Built for the systems behind your business.

42 → 43  
+2.4%Change

**Hero**  
Capability tags (CAPABILITY\_TAGS)Infrastructure·Operations·Automation·Integrations·AdTech

Web Platforms·Back-Office·Automation·Integrations·AdTech

Tags are separate items; | here separates tags, not lines. “Web Platforms” and “Back-Office” match the services. Also used in the CTA strip.

52 → 52  
+0.0%Change

**Hero**  
Rating badge labelsGoogle Rating · Based on Clutch reviews · Fiverr RatingFactual labels. Keep. Confirm the 4.8 rating is real before launch.Keep

**Services**  
Section heading (sr-only H2)Our services

Our business automation, ERP and web services

Visually hidden, so no layout limit. Gives the stack of cards a descriptive heading.

12 → 45  
+275.0%  
limit 125Change

**Services**  
Card 1 descriptionBuild, operate and maintain the digital infrastructure your business depends on.

Website development, hosting and upkeep for the platforms your business relies on.

80 → 82  
+2.5%Change

**Services**  
Card 2 descriptionStructured operational support for the workflows that keep your business moving.

Managed back-office support for the daily workflows that keep your business moving.

80 → 83  
+3.8%Change

**Services**  
Card 3 descriptionConnect processes, data and systems into a more efficient operating environment.

ERP implementation and automation that connects your data, processes and systems.

80 → 81  
+1.3%Change

**Services**  
Card 4 descriptionOperational infrastructure and execution support behind modern advertising teams.

AdTech operations, campaign trafficking and QA behind modern advertising teams.

81 → 79  
\-2.5%Change

**Services**  
Card button (Home)Explore our services

See service details

Same label on all 4 cards; the aria-label already adds the service name.

20 → 19  
\-5.0%Change

**Services**  
Card titles + 8 point lists eachWebsite Infrastructure · Back-Office Operations · ERP &amp; Business Systems · AdTechAlready keyword-rich (CMS Development, ERP Implementation, n8n Automation, Campaign Trafficking). Keep.Keep

**Services**  
Card 1 image altWebsite builds: a skincare storefront, a brand landing page and an AI meeting tool homepage

Website development examples: a skincare online store, a brand landing page and an AI meeting tool homepage

91 → 107  
+17.6%  
limit 125Change

**Services**  
Card 2 image altBack-office tools: an online store, a task queue, a support inbox and a warranty request dashboard

Back-office operations tools: an online store, a task queue, a support inbox and a warranty request dashboard

98 → 109  
+11.2%  
limit 125Change

**Services**  
Card 3 image altBusiness systems: a finance app, integrations such as HubSpot, n8n and Salesforce, and an operations dashboard

ERP and business systems: a finance app, integrations such as HubSpot, n8n and Salesforce, and an operations dashboard

110 → 118  
+7.3%  
limit 125Change

**Services**  
Card 4 image altAd campaigns: display creatives for a juice brand and a campaign manager across Google, Meta and TikTok

AdTech campaign operations: display creatives for a juice brand and a campaign manager across Google, Meta and TikTok

103 → 117  
+13.6%  
limit 125Change

**Operations**  
Eyebrow + H2Connected operations · Your business doesn’t operate in silos. Neither should your systems.Strong, specific, matches the wrap. Keep.Keep

**Operations**  
4 pillars + “Complexity grows quietly.” + 4 problem cardsPeople · Process · Systems · Technology …Clear and keyword-adjacent (CRM, ERP, CMS, DSP, APIs, automation already appear). Keep.Keep

**How we work**  
Section heading (sr-only, also the aria label)How we work

How we deliver automation, ERP and website projects

Visually hidden. The 4 slide titles (Discover. Design. Deliver. Improve.) stay as display type.

11 → 51  
+363.6%  
limit 125Change

**How we work**  
4 slide descriptionsWe begin by understanding the business, current systems, people, and operational friction points. …Keep.Keep

**Case studies**  
Eyebrow + H2Selected work · Systems are only useful when they improve outcomes.Keep.Keep

**Case studies**  
ParagraphAWTOMATIG works across infrastructure, operations, business systems and AdTech to turn fragmented processes into clearer, more scalable ways of working.

AWTOMATIG works across web infrastructure, back-office operations, ERP systems and AdTech to turn fragmented processes into clearer, scalable workflows.

152 → 152  
+0.0%Change

**Case studies**  
Card summary (Snaillia)Rebuilding a digital platform for speed, scale and easier management.

Rebuilding a website platform for speed, scale and easy management.

Names the thing (website). Same copy shows on /case-studies.

69 → 67  
\-2.9%Change

**Case studies**  
Stat label (typo)Pages migrated improved

Pages migrated and improved

Grammar fix. Values are still XX placeholders.

23 → 27  
+17.4%Change

**Case studies**  
Card description, challenge, tags, image alts, “View all case studies”A complete website infrastructure overhaul focused on improving performance …Already uses “website infrastructure”, “CMS”, “performance”. Keep.Keep

**Trusted operations**  
Eyebrow, H2, paragraph, card labels, “Trusted By Leading Companies”Operational support backed by real results. …Keep, but the 35+ / 50+ / 120+ / 75+ figures are copied from the mockup. Confirm they are real before launch.Keep

**Why AWTOMATIG**  
Eyebrow, H2, AWLABS card, 4 reason titlesTechnical capability. Operational understanding.Keep.Keep

**Why AWTOMATIG**  
Reason 1 description (typo)We look at how technology, workflows and teams interact not just isolated tools.

We look at how technology, workflows and teams interact, not just isolated tools.

Missing comma.

80 → 81  
+1.3%Change

**Client testimonials**  
Eyebrow, H2, paragraphWhat clients say after the work is done.Keep. The quotes and “Client Name goes here / \[Role] · \[Company]” are placeholders. Do not add Review schema until they are real.Keep

**Client testimonials**  
Quote 1 (placeholder, contains an em dash)What stood out was how quickly they understood the shape of the problem. They weren't just adding technology — they looked at how our team worked and built the solution around that.

What stood out was how quickly they understood the shape of the problem. They weren’t just adding technology. They looked at how our team worked and built the solution around that.

Removes the em dash. Replace the whole quote with a real one.

181 → 180  
\-0.6%Change

**Human operations**  
Eyebrow + H2Human operations · Technology connects the workflow. People keep it moving.Keep.Keep

**Human operations**  
ParagraphAWTOMATIG combines technical systems with structured operational support, helping businesses manage the work that technology alone cannot solve.

AWTOMATIG pairs ERP and automation systems with managed back-office support, helping businesses handle the work technology alone cannot solve.

144 → 142  
\-1.4%Change

**Human operations**  
Panel label + stats + image altOperational team view · 18 CRM tasks · 06 QA checks · 08 CampaignsKeep.Keep

**CTA**  
Eyebrow + H2Let’s talk · Let’s build what your business needs next.Keep.Keep

**CTA**  
ParagraphWhether the challenge sits in infrastructure, operations, ERP or AdTech,↵we help bring structure to the systems behind the business.

Whether the challenge sits in your website, operations, ERP or AdTech,↵we help bring structure to the systems behind your business.

132 → 131  
\-0.8%  
2 lines keptChange

**CTA**  
ButtonsStart a conversation · Message usKeep.Keep

## Services `/services`

The service cards on this page are the same component as Home’s (descriptions above apply here too). Only the card button differs: “Start a conversation”.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagServices

Business Automation, ERP &amp; Web Services

8 → 39  
+387.5%  
51 with brand · limit 60Change

**Meta**  
Meta descriptionWebsite infrastructure, back-office operations, ERP and business systems, and AdTech: the systems, operations and technology behind your business.

Website development, back-office operations, ERP implementation and AdTech services. AWTOMATIG builds and runs the systems behind your business.

146 → 144  
\-1.4%  
limit 160Change

**Hero**  
EyebrowServicesKeep.Keep

**Hero**  
H1The systems, operations↵and technology behind↵your business.

Automation, ERP and web↵systems behind your↵daily operations.

Line 1 is the same width as today (23 chars). Adds automation, ERP and web.

60 → 61  
+1.7%  
3 lines keptChange

**Hero**  
ParagraphAWTOMATIG works across digital infrastructure, operational support,↵business systems and AdTech to help businesses build stronger foundations,↵reduce operational friction and keep critical workflows moving.

AWTOMATIG works across website development, back-office operations,↵ERP and business systems and AdTech to help businesses build stronger↵foundations, reduce friction and keep critical workflows moving.

206 → 202  
\-1.9%  
3 lines keptChange

**Hero**  
Primary buttonExplore Our Services

View Our Services

20 → 17  
\-15.0%Change

**Hero**  
Secondary button + 4 area labelsStart a Conversation · service namesKeep.Keep

**What we do**  
Eyebrow, H2, leadFour disciplines built around how businesses actually operate.Already names CRM, ERP, campaign workflow and back-office process. Keep.Keep

**Service cards**  
Card button (Services page)Start a conversationKeep. Specific enough and leads to /contact.Keep

**Ecosystem**  
Eyebrow, H2, paragraph, stack labelsOne operating ecosystem · Your systems don’t operate independently. …Keep.Keep

**Ecosystem**  
Area 1 descriptionDigital entry points and custom platforms.

Websites, CMS builds and custom platforms.

42 → 42  
+0.0%Change

**Ecosystem**  
Area 3 title (name drift)ERP &amp; Systems

ERP &amp; Business Systems

Matches the service name used everywhere else. 22 chars fits: “Back-Office Operations” is already 22.

13 → 22  
+69.2%Consistency fix

**Ecosystem**  
Area 2 and 4 titles and descriptionsBack-Office Operations · AdTechKeep.Keep

**How we support**  
Eyebrow, H2, paragraph, Build / Operate / ImproveBuild it. Operate it. Improve it.Keep.Keep

**CTA**  
Eyebrow, H2, paragraph, noteWhat does your business need to run better?Keep.Keep

## Case Studies `/case-studies`

Only one real client (Snaillia) exists, repeated three times. Duplicate rows with identical copy is thin content; replace entries 2 and 3 with real studies before this page is submitted for indexing.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagCase Studies

Website, ERP &amp; Operations Case Studies

12 → 38  
+216.7%  
50 with brand · limit 60Change

**Meta**  
Meta descriptionHow AWTOMATIG helps businesses improve digital infrastructure, streamline operations, connect systems and strengthen the workflows behind everyday execution.

See how AWTOMATIG rebuilds websites, streamlines back-office operations, connects ERP systems and strengthens the workflows behind everyday execution.

157 → 150  
\-4.5%  
limit 160Change

**Hero**  
Eyebrow + H1Case Studies · The work matters. What changed matters more.Brand line. Keep; the keyword sits in the paragraph and meta.Keep

**Hero**  
ParagraphExplore how AWTOMATIG helps businesses improve digital infrastructure,↵streamline operations, connect systems and strengthen the workflows↵behind everyday execution.

See how AWTOMATIG helps businesses improve website infrastructure,↵streamline back-office operations, connect ERP systems and strengthen↵workflows behind everyday execution.

165 → 173  
+4.8%  
3 lines keptChange

**Hero**  
Primary buttonExplore Our Work

See Our Work

16 → 12  
\-25.0%Change

**All case studies**  
Eyebrow + H2All case studies · Different problems. Different systems. Measurable outcomes.Keep. “Measurable outcomes” needs real numbers behind it (stats are XX now).Keep

**All case studies**  
LeadFrom websites and operational workflows to ERP environments↵and advertising infrastructure, each engagement starts with a↵different challenge - but the goal stays the same: make the↵business work better.

From websites and operational workflows to ERP environments↵and advertising infrastructure, each engagement starts with a↵different challenge, but the goal stays the same: make the↵business work better.

Spaced hyphen replaced with a comma.

203 → 202  
\-0.5%  
4 lines keptChange

**List**  
Filter tabsAll · Websites · Back-office · ERP &amp; Systems · AdTechKeep.Keep

**List**  
Empty stateNo {filter} case studies yet. Start a conversation to talk about yours.Keep.Keep

**CTA**  
Eyebrow, H2, paragraph, noteWhat does your business need to run better?Same copy as Services. Keep, or give this page its own wording so the two CTAs are not duplicates.Keep

## Case study detail `/case-studies/[slug]`

Demo page that reuses the list data. Titles and descriptions below are templates for the real entries.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagSnaillia

Snaillia: Website Rebuild Case Study

8 → 36  
+350.0%  
48 with brand · limit 60Change

**Meta**  
Meta descriptionRebuilding a digital platform for speed, scale and easier management.

How AWTOMATIG rebuilt the Snaillia website for speed, scale and simpler content management, with a faster publishing workflow for the internal team.

69 → 148  
+114.5%  
limit 160Change

**Page**  
H1, summary, “The challenge”, tags, client / service, statsSnaillia · Rebuilding a digital platform …H1 stays the client name. Add a separate seoTitle / seoDescription field to each case study so meta is not the card summary.Keep

## About `/about`

About is brand-led, so headings stay human. Keywords go into the meta tags, the story paragraph and one mission line.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagAbout

About AWTOMATIG: Automation &amp; Systems Team

5 → 42  
+740.0%  
54 with brand · limit 60Change

**Meta**  
Meta descriptionMeet the people who build the systems behind the scenes: AWTOMATIG turns complex operations into clear, connected and efficient systems.

Meet the team behind AWTOMATIG. We turn complex operations into clear, connected business systems across websites, ERP, operations and AdTech.

136 → 142  
+4.4%  
limit 160Change

**Hero**  
Eyebrow + H1 + paragraph + listAbout AWTOMATIG · Meet the people who build the systems behind the scenes.Keep.Keep

**Our story**  
Eyebrow, H2, paragraphs 1 and 3Built to make complexity easier to manage.Keep.Keep

**Our story**  
Paragraph 2AWTOMATIG exists to solve that gap. We work across websites,↵business systems, operations and technology to turn disconnected↵pieces into practical, connected environments.

AWTOMATIG exists to solve that gap. We work across websites,↵ERP and business systems, operations and automation to turn↵disconnected pieces into practical, connected environments.

172 → 180  
+4.7%  
3 lines keptChange

**Mission and vision**  
Both cardsMake complex business operations clearer. · A future where business systems work as one.Keep.Keep

**How we think**  
Eyebrow, H2, 4 principlesGood systems should make work feel simpler.Keep.Keep

**Team**  
Names and rolesMark Colley · Anna William · Michael AbbyThese look like placeholder people. Do not publish invented names. Replace, or hide the section, before launch.Needs real content

**Team**  
Eyebrow, H2, paragraphA focused team, built around the work.Keep.Keep

**Growing with the work**  
Eyebrow, H2, 4 stepsFrom focused projects to connected systems.Keep.Keep

**Culture**  
Eyebrow, H2, paragraph, 4 values, image altSerious about the work. Human about the process.Keep.Keep

**Client testimonials**  
Shared sectionSee Home.Same placeholders as Home.Keep

**CTA**  
Eyebrow, H2, paragraph, noteHave something that needs to work better?Keep.Keep

## Process `/process`

The nine steps are already descriptive and keyword-relevant (audit, mapping, solution design, implementation, QA, optimization, support). Only meta and the hero button change.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagProcess

Our Project Process: Audit, Build and Support

7 → 45  
+542.9%  
57 with brand · limit 60Change

**Meta**  
Meta descriptionFrom understanding the problem to implementation and ongoing support, AWTOMATIG follows a structured process that keeps people, workflows, systems and technology aligned.

From discovery and audit to implementation and ongoing support, AWTOMATIG follows a structured process for website, ERP and automation projects.

170 → 144  
\-15.3%  
limit 160Change

**Hero**  
Eyebrow, H1, paragraphHow we work · Complex work needs a clear process.Keep.Keep

**Hero**  
Primary buttonExplore the Process

See the Process

19 → 15  
\-21.1%Change

**The process**  
Eyebrow, H2, paragraphFrom problem to working system.Keep.Keep

**The process**  
9 steps: name, title, description, tags, outputDiscovery · Audit · Mapping · Solution Design · Implementation · QA · Optimization · Ongoing Support · DeliveryKeep. Step photos have empty alt (decorative). Fine.Keep

**CTA**  
Eyebrow, H2, paragraph, noteWhat needs to work better?Keep.Keep

## Contact `/contact`

Contact’s job is conversion. Changes: a unique inquiry paragraph (it duplicates the Process paragraph today) and a keyword in the booking heading.

WhereCurrently writtenReplace withChars

**Meta**  
Title tagContact

Contact AWTOMATIG: Start Your Project

7 → 37  
+428.6%  
49 with brand · limit 60Change

**Meta**  
Meta descriptionTell us what needs to work better. You don’t need a fully defined solution: share what’s getting stuck and we’ll help identify the right direction.

Contact AWTOMATIG about websites, ERP, automation or operations. Share what’s getting stuck and we’ll help identify the right direction.

147 → 136  
\-7.5%  
limit 160Change

**Hero**  
Eyebrow, H1, paragraphStart a conversation · Tell us what needs to work better.Keep.Keep

**Inquiry**  
EyebrowTrust / Proof

Why choose us

“Trust / Proof” reads like a Figma layer name. Same section as the “Why AWTOMATIG” block lower down.

13 → 13  
+0.0%Change

**Inquiry**  
H2Trusted to support the systems behind growing businesses.Keep.Keep

**Inquiry**  
Paragraph (duplicate of the Process page)Every engagement is different, but the way we approach complexity↵stays structured. Each stage builds on the last, creating clarity before↵execution and control throughout delivery.

Share your goals, current tools and constraints. We review them↵first, then suggest a clear next step for your website, ERP,↵automation or ongoing operational support, whichever fits.

Removes duplicate content and describes what happens after the form.

181 → 183  
+1.1%  
3 lines keptChange

**Inquiry**  
Details listEmail · WhatsApp · Response: Typically within 1 business dayKeep, if the response time is true.Keep

**Form**  
Heading, labels, chips, consent, submitTell us about the project · Start the conversationKeep. Chip labels reuse the service names.Keep

**Proven**  
Eyebrow, H2, stat labels, “Trusted By Leading Companies”Proven across the systems that keep businesses moving.Keep. Stat values are XX+ placeholders.Keep

**Booking**  
H2Book a conversation↵instead.

Book a discovery↵call instead.

Adds “discovery call”, which matches the widget label.

28 → 30  
+7.1%  
2 lines keptChange

**Booking**  
Eyebrow, paragraph, buttons, widget headingPrefer to talk? · Book a call · Choose a timeKeep.Keep

## Privacy Policy and Terms `/privacy · /terms`

Legal pages are not an SEO target and the text is a draft pending legal review. Leave the body alone. Titles and descriptions are fine as they are.

WhereCurrently writtenReplace withChars

**Meta**  
Privacy: title + descriptionPrivacy Policy ↵ What personal information AWTOMATIG receives through this website and how it is used.Keep.Keep

**Meta**  
Terms: title + descriptionTerms &amp; Conditions ↵ The terms that apply to your use of the AWTOMATIG website.Keep.Keep

**Body**  
Legal text(see sections/shared/legal/legal.ts)Do not rewrite for SEO. Needs owner / legal review.Keep

## 404 page `unmatched URL`

Already noindex.

WhereCurrently writtenReplace withChars

**Page**  
H1 + text + buttonPage not found. · The page you’re looking for doesn’t exist, or has moved. · Back to homeKeep.Keep
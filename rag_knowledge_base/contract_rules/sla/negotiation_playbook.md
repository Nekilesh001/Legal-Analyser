# SLA — Negotiation Playbook

## Clause: Uptime Commitment Measured Annually (Not Monthly)
Act: Indian Contract Act 1872; commercial SLA best practices
Contract type: sla
Requirement: An annual uptime measurement allows the service provider to "bank" good months against a catastrophic month. If the system is down for 3 days in one month, an annual measurement may still show 99.5% overall. Monthly measurement provides meaningful accountability.
Standard counter-clause: "Uptime and all SLA metrics shall be measured on a per-calendar-month basis. A breach in any calendar month triggers the corresponding service credit for that month, regardless of performance in other months. The Service Provider may not offset credits earned in one month against credits owed in a different month."

## Clause: Service Credits Cap at 5% of Monthly Fee (Too Low)
Act: Indian Contract Act 1872, Section 74
Contract type: sla
Requirement: A 5% credit cap for severe SLA failures is insufficient compensation. For a complete month-long outage, the client would receive only 5% back — equivalent to recovering 1.5 days of a 30-day paid period. A meaningful cap should be at least 25-50% of the monthly fee.
Standard counter-clause: "Monthly service credits shall be calculated as [X]% of monthly fee per percent of availability below the committed level. Credits for Priority 1 incidents shall be an additional [5]% of monthly fee per incident unresolved beyond the agreed resolution time. Total monthly credits shall not exceed 50% of the monthly fee. Persistent failures (3+ months breach) trigger termination rights."

## Clause: Service Credits Are the Sole Remedy for All Breaches
Act: Indian Contract Act 1872, Section 73; tort principles
Contract type: sla
Requirement: Limiting all remedies to service credits (even for catastrophic outages, data loss, or security breaches) is unreasonable. Service credits may be appropriate for routine SLA failures but cannot adequately compensate for data breaches or loss of business caused by provider negligence.
Standard counter-clause: "Service credits are the Sole remedy for SLA availability and response time failures. For data loss, security breaches, or SLA failures caused by the Service Provider's gross negligence or wilful misconduct, the Client shall be entitled to full damages under the indemnification clause in addition to service credits."

## Clause: Scheduled Maintenance Excluded Without Limit
Act: Indian Contract Act 1872; commercial SLA standards
Contract type: sla
Requirement: A clause allowing unlimited scheduled maintenance (excluded from uptime calculation) can be exploited to schedule maintenance whenever the provider wants, effectively making the uptime commitment meaningless. Total scheduled maintenance must be capped.
Standard counter-clause: "Scheduled maintenance windows shall be limited to a maximum of 8 hours per calendar month. Any scheduled maintenance exceeding this cap shall be counted as downtime for uptime calculation purposes. Maintenance must be scheduled during the agreed maintenance window (11 PM to 5 AM IST on weekends) and with minimum 48 hours advance notice."

## Clause: Force Majeure Defined Too Broadly (Includes Provider Infrastructure Failures)
Act: Indian Contract Act 1872, Section 56 (frustration); force majeure jurisprudence
Contract type: sla
Requirement: In IT service contracts, "force majeure" should not include failures within the service provider's own infrastructure (server failures, cooling system failures, software bugs). Force majeure should be limited to events genuinely outside the provider's control.
Standard counter-clause: "Force majeure events are limited to: acts of God, war, terrorism, government orders, nation-wide telecom infrastructure failures, and natural disasters. Force majeure shall NOT include: failures of the Service Provider's own hardware, software, or cloud infrastructure; power failures at the Service Provider's data center (which should have UPS and generator backup); or staffing shortages."

## Clause: Performance Metrics Not Independently Verifiable
Act: Indian Contract Act 1872; evidence standards
Contract type: sla
Requirement: Self-reported SLA compliance without independent verification creates a conflict of interest. The client must have access to raw performance monitoring data (not just the service provider's summary reports) to independently verify compliance.
Standard counter-clause: "The Service Provider shall provide the Client with real-time read-only access to the service performance monitoring dashboard or API, showing uptime, response times, and incident logs. The Client's own monitoring tools (e.g., external uptime checkers) shall be the definitive source for uptime calculation in case of dispute."

## Clause: No Data Portability on Termination
Act: IT Act 2000; data sovereignty principles; best practices
Contract type: sla
Requirement: When an SLA is terminated, the client must be able to retrieve all their data in a usable format. A clause that doesn't guarantee data return (in a standard, documented format) effectively creates vendor lock-in and can be leveraged to prevent legitimate termination.
Standard counter-clause: "Upon termination or expiration of this agreement, the Service Provider shall: (a) provide the Client with a complete export of all Client data in [specified standard formats] within 30 days; (b) ensure the exported data is complete, intact, and validated; (c) retain the data for an additional 60 days post-export for verification; and (d) permanently and verifiably destroy all Client data thereafter. No additional fees shall be charged for this data return."

## Clause: Liability Cap Below the Cost of Potential Harm
Act: Indian Contract Act 1872, Section 73–74
Contract type: sla
Requirement: A liability cap set at one month's fee or 3 months' fee is inadequate where the client's loss from an extended outage or data breach substantially exceeds this amount. The cap should be proportionate to the risk the client faces.
Standard counter-clause: "The Service Provider's total liability under this agreement for any and all claims shall not exceed [12] months of fees paid by the Client in the 12 months preceding the event giving rise to the claim. For data breaches and losses caused by gross negligence or wilful misconduct, this cap shall be increased to [24] months of fees."

## Clause: No Business Continuity Plan (BCP) Requirement
Act: RBI guidelines for IT service providers to regulated entities; SEBI CSCRF; IT Act 2000
Contract type: sla
Requirement: For any mission-critical service, the service provider must maintain a Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP). Regulated industries (banking, insurance, securities) require third-party vendors to have these in place.
Standard counter-clause: "The Service Provider shall maintain and annually test a Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP). The BCP/DRP shall target RPO of [4] hours and RTO of [8] hours. The Service Provider shall provide the Client with a summary of the BCP/DRP on request and shall share the results of annual BCP testing within 60 days of the test."

## Clause: Response Time SLA Without On-Call Support Definition
Act: Indian Contract Act 1872; commercial IT service standards
Contract type: sla
Requirement: A 24/7 response time commitment is meaningless without specifying whether on-call support actually covers all hours (including public holidays and weekends) or only business hours. The definition of "business hours" must be explicit.
Standard counter-clause: "Support coverage shall be: Priority 1 and 2 incidents: 24x7x365 (including weekends and Indian public holidays). Priority 3 and 4 incidents: 9 AM to 6 PM IST, Monday to Friday, excluding Indian national holidays. The Service Provider shall maintain a staffed on-call rotation with confirmed contact details available to the Client at all times."

## Clause: Client Cannot Terminate Without Paying Full Remaining Contract Value
Act: Indian Contract Act 1872, Section 73–74; duty to mitigate
Contract type: sla
Requirement: Requiring a client to pay 100% of remaining contract value upon termination (even for cause) is a penalty clause that courts may reduce. A reasonable termination for cause provision should allow exit without penalty when the provider persistently breaches the SLA.
Standard counter-clause: "Termination for cause (persistent SLA failure, security breach, or material contract breach not cured within 30 days of notice) shall not require payment of any termination fee. Termination for convenience shall require 60 days notice and payment of fees for the notice period only, plus reimbursement of non-cancellable third-party commitments made by the Service Provider on the Client's behalf."

## Clause: Vendor Can Replace Key Personnel Without Notice
Act: Indian Contract Act 1872; standard IT outsourcing best practices
Contract type: sla
Requirement: In outsourcing arrangements, key personnel expertise is often the core service being purchased. Allowing the vendor to replace key resources without notice or client approval undermines the service quality commitment.
Standard counter-clause: "The Service Provider shall identify Key Personnel for this engagement in Schedule C. Replacement of Key Personnel requires: (a) 20 business days advance notice to the Client; (b) handover documentation; (c) Client's right to interview and approve the proposed replacement (approval not to be unreasonably withheld); (d) a minimum 2-week parallel operation period."

## Clause: SLA Metrics Not Tied to Business Impact
Act: Indian Contract Act 1872; commercial contract best practices
Contract type: sla
Requirement: Technical SLA metrics (server uptime) that are not tied to business impact (application availability as experienced by end users) can result in the provider claiming compliance while users experience poor service. SLA should measure end-user experience.
Standard counter-clause: "SLA measurement shall be based on end-user experience at the application layer, not server-side infrastructure metrics alone. Availability shall be measured using external synthetic monitoring from [3] geographically distributed monitoring points within India. Server uptime metrics shall be supplementary data, not the basis for credit calculation."

## Clause: No Requirement for Regular Security Patching
Act: IT Act 2000, Section 43A; CERT-In directives; ISO 27001
Contract type: sla
Requirement: Without mandatory patching timelines, a service provider may run systems with known critical vulnerabilities for extended periods. CERT-In issues mandatory patching directives for critical vulnerabilities. The SLA must include binding patch management timelines.
Standard counter-clause: "The Service Provider shall apply security patches within the following timeframes from CERT-In or vendor advisory: Critical vulnerabilities (CVSS 9.0+): within 24 hours or immediately on next maintenance window. High vulnerabilities (CVSS 7.0-8.9): within 7 days. Medium vulnerabilities: within 30 days. Low vulnerabilities: within 90 days. Patch application shall be documented and reported monthly."

## Clause: Vendor Self-Certifies Compliance Without Third-Party Audit
Act: IT Act 2000, Section 43A; ISO 27001; SOC 2 standards; RBI guidelines
Contract type: sla
Requirement: Self-certification of security and SLA compliance is insufficient for regulated industries and significant IT investments. Independent third-party audits (SOC 2, ISO 27001 certification, CERT-In empanelled auditor) provide objective evidence of compliance.
Standard counter-clause: "The Service Provider shall maintain and provide the Client with copies of: (a) a current ISO 27001 certification or SOC 2 Type II report issued by an accredited certification body; (b) an annual Vulnerability Assessment and Penetration Testing (VAPT) report by a CERT-In empanelled auditor. These reports shall be provided to the Client within 30 days of issuance."

import type { Company, CompanySize, CompanyStatus, Contact } from "@/types";
import { daysAgo, hoursAgo, seededRandom, slugify } from "@/lib/utils";
import { WORKSPACE_ID } from "./workspace";

/**
 * name | industry | city | country | size | employees | description | status | score | tags
 */
type CompanySeed = [
  string,
  string,
  string,
  string,
  CompanySize,
  number,
  string,
  CompanyStatus,
  number,
  string[],
];

const COMPANY_SEEDS: CompanySeed[] = [
  ["Northbeam Marketing", "Marketing Agency", "Austin, TX", "United States", "11-50", 34, "Full-service growth agency running paid media and lifecycle programs for franchise brands.", "engaged", 94, ["ghl", "automation", "agency"]],
  ["Harbor & Pine Dental", "Health & Wellness", "Portland, OR", "United States", "11-50", 22, "Three-location dental group scaling new patient acquisition across the Pacific Northwest.", "engaged", 88, ["crm", "intake"]],
  ["Vantage Roofing Co.", "Home Services", "Denver, CO", "United States", "51-200", 84, "Residential and commercial roofing contractor with a 40-person field crew.", "prospect", 81, ["speed-to-lead", "home-services"]],
  ["Clearwater Realty Group", "Real Estate", "Tampa, FL", "United States", "51-200", 120, "Boutique brokerage with 90 agents and a high-volume inbound seller pipeline.", "engaged", 92, ["ghl", "real-estate"]],
  ["Bright Lane Legal", "Professional Services", "Chicago, IL", "United States", "11-50", 28, "Personal injury firm investing in intake automation and case status messaging.", "prospect", 76, ["intake", "compliance"]],
  ["Sunset Fitness Collective", "Health & Wellness", "San Diego, CA", "United States", "11-50", 41, "Boutique gym network running challenge funnels and member retention campaigns.", "prospect", 73, ["funnels", "membership"]],
  ["Meridian HVAC Solutions", "Home Services", "Phoenix, AZ", "United States", "51-200", 96, "Commercial HVAC service provider replacing spreadsheets with a real pipeline.", "engaged", 86, ["crm", "field-service"]],
  ["Cobalt Ridge Consulting", "Professional Services", "Toronto, ON", "Canada", "11-50", 19, "Operations consultancy for mid-market manufacturers modernising their stack.", "prospect", 69, ["consulting"]],
  ["Willow & Vine Interiors", "Construction", "Nashville, TN", "United States", "1-10", 9, "High-end residential interior design studio with a six-month project backlog.", "prospect", 62, ["design"]],
  ["Tidewater Insurance Group", "Financial Services", "Norfolk, VA", "United States", "51-200", 143, "Independent insurance brokerage automating quote follow-up across 6 offices.", "engaged", 90, ["automation", "insurance"]],
  ["Lumen Path Academy", "Education", "Manchester", "United Kingdom", "11-50", 37, "Career-change bootcamp with a heavy admissions call volume.", "prospect", 71, ["admissions", "nurture"]],
  ["Orchard Street Dental Group", "Health & Wellness", "Brooklyn, NY", "United States", "11-50", 26, "Multi-specialty dental practice replacing manual recall calls with automation.", "prospect", 79, ["recall", "crm"]],
  ["Pacific Crest Landscaping", "Home Services", "Seattle, WA", "United States", "11-50", 48, "Design-build landscaping firm with seasonal demand spikes.", "prospect", 66, ["seasonal"]],
  ["Redstone Auto Group", "E-commerce", "Calgary, AB", "Canada", "201-500", 260, "Five-dealership auto group centralising lead routing and service reminders.", "engaged", 89, ["automotive", "routing"]],
  ["Beacon Hill Wealth Partners", "Financial Services", "Boston, MA", "United States", "11-50", 31, "Registered advisory firm formalising its referral and review process.", "prospect", 74, ["referrals", "compliance"]],
  ["Ironwood Construction Partners", "Construction", "Dallas, TX", "United States", "51-200", 175, "Commercial general contractor building a bid-to-close reporting workflow.", "prospect", 68, ["bids"]],
  ["Summit Peak Chiropractic", "Health & Wellness", "Salt Lake City, UT", "United States", "1-10", 8, "Two-provider clinic that lives and dies on appointment show rate.", "prospect", 64, ["reminders"]],
  ["Nova Bloom Skincare", "E-commerce", "Los Angeles, CA", "United States", "11-50", 44, "DTC skincare brand expanding into subscription and win-back flows.", "engaged", 83, ["ecommerce", "lifecycle"]],
  ["Harborline Logistics", "Professional Services", "Liverpool", "United Kingdom", "201-500", 320, "Freight forwarder digitising its quote desk and carrier follow-up.", "prospect", 70, ["quotes"]],
  ["Kestrel Digital Studio", "Marketing Agency", "Sydney", "Australia", "11-50", 23, "Performance agency looking for a white-label automation partner.", "engaged", 91, ["white-label", "ghl"]],
  ["Fairfield Med Spa", "Health & Wellness", "Scottsdale, AZ", "United States", "11-50", 18, "Aesthetics clinic with high-ticket consults and a busy DM inbox.", "engaged", 87, ["dm", "booking"]],
  ["Copperfield Plumbing", "Home Services", "Kansas City, MO", "United States", "11-50", 39, "Emergency plumbing service where every missed call is lost revenue.", "prospect", 77, ["speed-to-lead"]],
  ["Alderman Recruiting", "Professional Services", "London", "United Kingdom", "11-50", 46, "Specialist recruiter running candidate and client sequences in parallel.", "prospect", 72, ["sequences"]],
  ["Trellis Software", "SaaS", "Vancouver, BC", "Canada", "51-200", 88, "B2B scheduling platform outsourcing its onboarding automation build.", "prospect", 80, ["saas", "onboarding"]],
  ["Golden Gate Solar", "Home Services", "Oakland, CA", "United States", "51-200", 112, "Residential solar installer with a long, document-heavy sales cycle.", "engaged", 85, ["long-cycle"]],
  ["Marlowe & Finch Accounting", "Financial Services", "Leeds", "United Kingdom", "11-50", 33, "Accountancy practice automating onboarding and annual renewal reminders.", "prospect", 67, ["onboarding"]],
  ["Cedar Falls Veterinary", "Health & Wellness", "Madison, WI", "United States", "11-50", 24, "Companion animal hospital moving reminders off manual phone calls.", "prospect", 61, ["reminders"]],
  ["Palm Harbor Property Group", "Real Estate", "Dubai", "United Arab Emirates", "51-200", 140, "Luxury property developer managing international buyer enquiries.", "engaged", 93, ["luxury", "international"]],
  ["Vertex Growth Agency", "Marketing Agency", "Singapore", "Singapore", "11-50", 29, "APAC growth agency reselling automation retainers to its client base.", "client", 96, ["white-label", "retainer"]],
  ["Stonebridge Home Remodeling", "Construction", "Columbus, OH", "United States", "11-50", 52, "Kitchen and bath remodeler with a 3-week estimate backlog.", "prospect", 75, ["estimates"]],
];

const rand = seededRandom(20260831);

export const COMPANIES: Company[] = COMPANY_SEEDS.map(
  ([name, industry, city, country, size, employeeCount, description, status, leadScore, tags], index) => {
    const slug = slugify(name).replace(/-co$|-group$/, "");
    const domain = `${slug.replace(/-/g, "")}.com`;
    return {
      id: `cmp_${index + 1}`,
      workspaceId: WORKSPACE_ID,
      name,
      domain,
      website: `https://${domain}`,
      industry,
      location: `${city}, ${country === "United States" ? "US" : country}`,
      country,
      size,
      employeeCount,
      description,
      linkedinUrl: `https://linkedin.com/company/${slug}`,
      status,
      leadScore,
      openOpportunities: 1 + Math.floor(rand() * 3),
      tags,
      createdAt: daysAgo(30 + Math.floor(rand() * 150)),
      lastActivityAt: hoursAgo(1 + Math.floor(rand() * 200)),
    };
  },
);

/** companyIndex | full name | title | primary */
type ContactSeed = [number, string, string, boolean];

const CONTACT_SEEDS: ContactSeed[] = [
  [0, "Adrienne Kohl", "Director of Operations", true],
  [0, "Marcus Whitfield", "Head of Paid Media", false],
  [1, "Dr. Elena Marchetti", "Practice Owner", true],
  [1, "Sofia Brenner", "Patient Coordinator", false],
  [2, "Grant Halloway", "General Manager", true],
  [2, "Tanya Rios", "Office Manager", false],
  [3, "Priscilla Nunes", "Managing Broker", true],
  [3, "Devin Achebe", "Marketing Lead", false],
  [4, "Nathaniel Brooks", "Managing Partner", true],
  [5, "Camille Ortega", "Founder", true],
  [5, "Jonas Feldt", "Membership Director", false],
  [6, "Rosalind Meyer", "VP Operations", true],
  [6, "Curtis Yamada", "Service Manager", false],
  [7, "Hugo Lambert", "Principal Consultant", true],
  [8, "Willa Bennington", "Studio Director", true],
  [9, "Terrence Okafor", "Chief Revenue Officer", true],
  [9, "Marguerite Vasquez", "Agency Operations Lead", false],
  [10, "Imogen Sadler", "Head of Admissions", true],
  [11, "Dr. Aaron Feldman", "Clinical Director", true],
  [11, "Nia Castellanos", "Front Office Lead", false],
  [12, "Bryce Kittredge", "Owner", true],
  [13, "Landon Fitzroy", "Group Marketing Director", true],
  [13, "Simone Beaulieu", "BDC Manager", false],
  [14, "Evelyn Marchand", "Managing Director", true],
  [15, "Roland Whitaker", "Preconstruction Manager", true],
  [16, "Dr. Kaya Lindstrom", "Owner", true],
  [17, "Bianca Delacroix", "Head of Growth", true],
  [17, "Oscar Mendive", "Retention Manager", false],
  [18, "Callum Prescott", "Commercial Director", true],
  [19, "Harriet Nakamura", "Managing Director", true],
  [19, "Felix Ambrose", "Delivery Lead", false],
  [20, "Danielle Rousseau", "Clinic Director", true],
  [21, "Wesley Tomlin", "Owner", true],
  [22, "Fiona Callahan", "Director of Talent", true],
  [23, "Ravi Chandrasekar", "VP Customer Success", true],
  [23, "Molly Adeyemi", "Onboarding Manager", false],
  [24, "Antoine Rivera", "Sales Director", true],
  [25, "Gareth Pemberton", "Practice Manager", true],
  [26, "Dr. Sylvia Ndlovu", "Hospital Administrator", true],
  [27, "Yasmin Al-Hakim", "Head of Sales", true],
  [27, "Rafael Duarte", "Buyer Relations Manager", false],
  [28, "Wei Ling Chua", "Managing Partner", true],
  [28, "Sasha Brightman", "Client Services Director", false],
  [29, "Melinda Kovacs", "Owner", true],
  [2, "Peter Aldridge", "Sales Manager", false],
  [4, "Odessa Kim", "Intake Supervisor", false],
  [7, "Isabelle Nordstrom", "Business Analyst", false],
  [12, "Harper Nakashima", "Crew Coordinator", false],
  [16, "Trent Bellamy", "Clinic Coordinator", false],
  [24, "Noelle Sanderson", "Operations Manager", false],
];

export const CONTACTS: Contact[] = CONTACT_SEEDS.map(([companyIndex, fullName, title, isPrimary], index) => {
  const company = COMPANIES[companyIndex];
  const handle = fullName
    .toLowerCase()
    .replace(/^dr\.\s+/, "")
    .split(" ")
    .map((part) => part.replace(/[^a-z]/g, ""))
    .join(".");
  return {
    id: `cnt_${index + 1}`,
    workspaceId: WORKSPACE_ID,
    companyId: company.id,
    fullName,
    title,
    email: `${handle}@${company.domain}`,
    phone: `+1 (${200 + (index % 700)}) 555-${String(1000 + index * 7).slice(0, 4)}`,
    linkedinUrl: `https://linkedin.com/in/${handle.replace(/\./g, "-")}`,
    isPrimary,
    createdAt: company.createdAt,
  };
});

export function getCompanyById(id: string): Company | undefined {
  return COMPANIES.find((company) => company.id === id);
}

export function getContactsByCompany(companyId: string): Contact[] {
  return CONTACTS.filter((contact) => contact.companyId === companyId);
}

export function getPrimaryContact(companyId: string): Contact | undefined {
  const contacts = getContactsByCompany(companyId);
  return contacts.find((contact) => contact.isPrimary) ?? contacts[0];
}

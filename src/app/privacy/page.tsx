"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { useSmartBack } from "@/hooks/use-smart-back";

/**
 * Privacy Policy - Ultra Minimal Industrial Style
 * Precisely containing 100% of the User provided content.
 */
const PrivacyPolicy = () => {
  const router = useRouter();
  const handleBack = useSmartBack("/home");
  const effectiveDate = "April 9, 2026";

  return (
    <div className="min-h-screen bg-background pt-6 md:pt-32 pb-20 md:pb-40 selection:bg-primary/10">
      <div className="container mx-auto px-6 max-w-2xl">
        <button
          onClick={handleBack}
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-20"
        >
          <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <header className="mb-8 md:mb-24">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Privacy Policy.</h1>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase bg-muted/50 w-fit px-4 py-2 rounded-md border border-border/50">
            <Clock className="w-3 h-3" />
            <span>Effective: {effectiveDate || "[Insert Date]"}</span>
          </div>
        </header>

        <div className="space-y-16 text-muted-foreground leading-relaxed text-sm md:text-base">
          {/* Intro Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Privacy Policy for TilawaNow</h2>
            <p className="text-lg text-foreground/80 font-medium italic">
              Effective Date: {effectiveDate}
            </p>
            <p>
              TilawaNow (“we,” “our,” or “us”) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you use our website, services, and features.
            </p>
            <p>
              TilawaNow is a platform designed to help users read, listen to, understand, and build a meaningful relationship with the Holy Qur’an. Our platform includes Qur’an reading tools, audio listening, AI-assisted guidance, bookmarks, progress tracking, and related spiritual and educational features.
            </p>
            <p>
              By using TilawaNow, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="space-y-8">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">1. Information We Collect</h3>
            <p>We collect information in the following ways:</p>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground">A. Personal Information</h4>
              <p>When you create an account or use certain features, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Account credentials and authentication data, including data handled through Supabase Auth</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground">B. Usage Information</h4>
              <p>We may automatically collect information about how you use TilawaNow, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pages you visit</li>
                <li>Features you use, such as AI tools, audio playback, bookmarks, and khatmah progress</li>
                <li>Session duration</li>
                <li>Device type</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>IP address</li>
                <li>Approximate location derived from IP address</li>
                <li>Log and diagnostic data</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground">C. User-Generated Content</h4>
              <p>When you use the platform, you may submit content such as:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bookmarks</li>
                <li>Notes</li>
                <li>Khatmah progress</li>
                <li>Search queries</li>
                <li>AI chat inputs</li>
                <li>Saved preferences (stored locally on your device)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground">D. Sensitive Data</h4>
              <p>TilawaNow is built around Qur’anic engagement, so some user activity may reflect religious interest or practice. However:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We do not intentionally collect sensitive personal data for profiling or advertising purposes</li>
                <li>We do not use religious data to discriminate, rank, or target users</li>
                <li>Any information you share is used only to provide and improve the platform’s functionality</li>
              </ul>
              <p className="font-bold text-foreground/80 mt-4 italic">
                We strongly advise users not to enter highly sensitive personal information into AI prompts, notes, or public-facing fields.
              </p>
            </div>
          </section>

          {/* 2. How We Use */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">2. How We Use Your Information</h3>
            <p>We use collected information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage user accounts</li>
              <li>To authenticate users securely</li>
              <li>To provide Qur’an reading, listening, bookmarking, and khatmah tracking features</li>
              <li>To personalize your experience</li>
              <li>To generate AI-assisted responses and guidance</li>
              <li>To improve platform performance, stability, and usability</li>
              <li>To analyze usage trends and feature effectiveness</li>
              <li>To communicate with you about your account, updates, and support</li>
              <li>To send emails where necessary, including through third-party email services</li>
              <li>To detect, prevent, and respond to fraud, abuse, security incidents, and technical issues</li>
              <li>To comply with legal obligations where applicable</li>
            </ul>
          </section>

          {/* 3. AI Data Usage */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">3. AI Data Usage</h3>
            <p>TilawaNow may use third-party AI services, including <span className="font-bold italic">OpenRouter</span> and <span className="font-bold italic">Puter.js</span>, to provide intelligent responses and assistance.</p>
            <p>When you use AI features:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your prompts and related context may be sent to third-party AI providers (such as OpenAI, Anthropic, or others via OpenRouter and Puter.js) for processing</li>
              <li>These providers may temporarily process or retain data according to their own technical and policy terms</li>
              <li>AI systems are used to generate responses, support understanding, and improve the user experience</li>
            </ul>
            <div className="bg-muted p-6 rounded-2xl border border-border/50">
              <p className="font-bold text-foreground mb-4">Important:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm italic">
                <li>Do not share passwords, financial details, private identity documents, or other highly sensitive personal information in AI chats</li>
                <li>AI-generated responses may not always be accurate, complete, or suitable for religious, legal, or personal decision-making</li>
                <li>Users should verify important guidance independently</li>
              </ul>
            </div>
            <p className="border-l-4 border-primary pl-4 py-2 bg-primary/5 italic">
              "We do not intentionally use your personal data to train our own models. Any processing by third-party AI providers is governed by their respective policies and settings."
            </p>
          </section>

          {/* 4. Cookies */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">4. Cookies and Tracking Technologies</h3>
            <p>TilawaNow may use cookies, local storage, session storage, or similar technologies for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keeping you signed in</li>
              <li>Remembering your preferences</li>
              <li>Storing session information</li>
              <li>Supporting core site functionality</li>
              <li>Measuring performance and usage</li>
              <li>Improving user experience</li>
            </ul>
            <p>You may disable cookies through your browser settings, but some features may not function properly if you do.</p>
          </section>

          {/* 5. Sharing */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">5. How We Share Your Information</h3>
            <p className="font-bold text-foreground">We do not sell your personal data.</p>
            <p>We may share information only with trusted service providers that help us operate TilawaNow, including:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-bold">Supabase</span> – authentication, database, and backend services</li>
              <li><span className="font-bold">OpenRouter & Puter.js</span> – AI processing and response generation</li>
              <li><span className="font-bold">Email Service Providers</span> – sending emails and notifications</li>
              <li>Other infrastructure or security providers as needed to run the service</li>
            </ul>
            <p>These providers may process data only for the purposes of delivering their services to us. They are not permitted to use your data for unrelated purposes unless their own policies apply.</p>
            <p>We may also disclose information if required:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To comply with law, regulation, or legal process</li>
              <li>To protect our rights, users, systems, or property</li>
              <li>To investigate misuse, fraud, or security threats</li>
              <li>In connection with a merger, acquisition, restructuring, or asset transfer</li>
            </ul>
          </section>

          {/* 6. Retention */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">6. Data Retention</h3>
            <p>We retain personal data only as long as necessary for the purposes described in this Privacy Policy, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>While your account remains active</li>
              <li>As needed to provide app functionality such as bookmarks, notes, and progress tracking</li>
              <li>For a limited period after account deletion, if required for legal, security, or operational reasons</li>
              <li>Logs and diagnostic records may be retained for a limited duration, typically 30 to 90 days, unless longer retention is required for security or legal reasons</li>
            </ul>
            <p>If you delete your account, we will remove or anonymize your data according to our internal deletion process and applicable legal obligations.</p>
          </section>

          {/* 7. Rights */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">7. Your Rights and Choices</h3>
            <p>Depending on your location, you may have some or all of the following rights:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your data (Right to be Forgotten)</li>
              <li>Object to certain processing</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Restrict certain processing, where applicable</li>
            </ul>
            <p>To exercise these rights, contact us at <span className="font-mono">tilawanow@gmail.com</span>.</p>
            <p>We may need to verify your identity before fulfilling certain requests.</p>
          </section>

          {/* 8. Security */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">8. Security Measures</h3>
            <p>We take reasonable technical and organizational measures to protect your information, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS encryption in transit</li>
              <li>Secure authentication through Supabase</li>
              <li>Access controls to limit unauthorized access</li>
              <li>Data handling practices designed to reduce exposure</li>
              <li>Monitoring and safeguards against misuse and abuse</li>
            </ul>
            <p>No system is completely secure. While we work hard to protect your data, we cannot guarantee absolute security.</p>
          </section>

          {/* 9. Children */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">9. Children’s Privacy</h3>
            <p>TilawaNow is not intended for children under 13 years of age. If you are located in a jurisdiction where a higher minimum age applies, that higher age will apply.</p>
            <p>We do not knowingly collect personal information from children under the applicable minimum age. If we learn that such information has been collected, we will take steps to delete it.</p>
            <p>If you believe a child has provided personal data to us, contact us immediately.</p>
          </section>

          {/* 10. International - GDPR & CCPA */}
          <section className="space-y-8">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">10. International & Regional Disclosures</h3>
            
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-xs">GDPR (European Economic Area)</h4>
              <p>For users in the EEA, our legal basis for processing your information depends on the context. Most processing is based on (a) performance of our contract with you (Terms of Service), (b) our legitimate interests in providing and improving the service, or (c) your explicit consent.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-xs">CCPA (California Consumer Privacy Act)</h4>
              <p>We do not "sell" personal information as defined by the CCPA. We only share information with service providers to operate the platform. California residents have the right to request access to their data and its deletion twice per 12-month period.</p>
            </div>

            <p>TilawaNow may be accessed globally. Your information may be processed and stored in countries other than your own. By using TilawaNow, you consent to this global processing.</p>
          </section>

          {/* 11. Donations */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">11. Donations and Support</h3>
            <p>TilawaNow is free to use. Users may choose to support the platform through donations.</p>
            <p>If you make a donation:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment-related data may be handled by third-party donation or payment providers</li>
              <li>We do not store full payment card details on our servers unless explicitly stated</li>
              <li>Any donation processing is subject to the privacy policy of the payment provider used</li>
            </ul>
          </section>

          {/* 12. 3rd Party */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">12. Third-Party Services</h3>
            <p>TilawaNow depends on third-party services to deliver certain features. These services may have their own privacy practices. We encourage you to review their policies, especially for:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Authentication</li>
              <li>AI processing</li>
              <li>Email delivery</li>
              <li>Hosting and infrastructure</li>
              <li>Donation or payment processing, if applicable</li>
            </ul>
            <p>We are not responsible for the privacy practices of third-party websites or services beyond our reasonable control.</p>
          </section>

          {/* 13. Changes */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">13. Changes to This Privacy Policy</h3>
            <p>We may update this Privacy Policy from time to time to reflect changes in our services, legal obligations, or operational practices.</p>
            <p>When we make material changes, we may notify users by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Posting the updated policy on this page</li>
              <li>Updating the “Effective Date”</li>
              <li>Showing an in-app notice or email notice, where appropriate</li>
            </ul>
            <p>Your continued use of TilawaNow after changes become effective means you accept the updated policy.</p>
          </section>

          {/* 14. Contact */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 w-fit">14. Contact Us</h3>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data (Data Controller: TilawaNow Team), contact us at:</p>
            <div className="space-y-1 italic text-foreground/90">
              <p>Email: tilawanow@gmail.com</p>
              <p>Website: TilawaNow.vercel.app</p>
            </div>
          </section>

          {/* Final Logic Footer */}
          <footer className="pt-24 border-t border-border mt-32 leading-relaxed opacity-60 text-xs">
            <p>
              This Privacy Policy is intended to provide clear information about how TilawaNow handles user data. It does not create contractual rights beyond those required by applicable law.
            </p>
            <p className="mt-4">© {new Date().getFullYear()} TilawaNow Team</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Mail } from "lucide-react";
import { useSmartBack } from "@/hooks/use-smart-back";

/**
 * Terms & Conditions - Ultra Minimal Industrial Style
 * Precisely containing 100% of the User provided content.
 */
const TermsConditions = () => {
  const router = useRouter();
  const handleBack = useSmartBack("/home");
  const effectiveDate = "April 9, 2026";

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p>By accessing or using TilawaNow, you confirm that you have read, understood, and agreed to these Terms, along with our Privacy Policy.</p>
          <p>If you are using TilawaNow on behalf of another person or entity, you represent that you have authority to accept these Terms on their behalf.</p>
        </div>
      )
    },
    {
      title: "2. Description of Service",
      content: (
        <div className="space-y-4">
          <p>TilawaNow provides Qur’an-related digital services, which may include:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>Qur’an reading tools</li>
            <li>Qur’an audio listening</li>
            <li>AI-assisted explanations or summaries</li>
            <li>Bookmarks and notes</li>
            <li>Khatmah tracking and progress features</li>
            <li>User account features and saved preferences (stored locally on your device)</li>
            <li>Donation or support options</li>
          </ul>
          <p>We may update, add, remove, suspend, or modify features at any time, with or without notice.</p>
        </div>
      )
    },
    {
      title: "3. User Accounts",
      content: (
        <div className="space-y-4">
          <p>Some features may require an account. You agree to:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>Provide accurate, complete, and current information</li>
            <li>Keep your login credentials secure</li>
            <li>Be responsible for all activity under your account</li>
            <li>Notify us immediately if you suspect unauthorized access or account misuse</li>
          </ul>
          <p>We may suspend, restrict, or terminate accounts if we believe a user has violated these Terms, misused the platform, or threatened the security or integrity of the service.</p>
        </div>
      )
    },
    {
      title: "4. Acceptable Use",
      content: (
        <div className="space-y-4">
          <p>You agree to use TilawaNow responsibly and lawfully. You must not:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>Abuse, manipulate, or disrupt the AI system</li>
            <li>Attempt to reverse engineer, interfere with, or overload the service</li>
            <li>Upload or submit illegal, harmful, abusive, hateful, threatening, obscene, or defamatory content</li>
            <li>Attempt unauthorized access, hacking, scraping, crawling, or automated extraction of data</li>
            <li>Use bots, scripts, or automation to exploit the system</li>
            <li>Impersonate another person or falsely claim affiliation</li>
            <li>Use the platform in any way that violates applicable law or these Terms</li>
            <li>Share malicious code, malware, or exploit attempts</li>
            <li>Use the service to harass, spam, or scam others</li>
          </ul>
          <p>We may investigate and take action against any misuse.</p>
        </div>
      )
    },
    {
      title: "5. Religious Content Disclaimer",
      content: (
        <div className="space-y-4">
          <p>TilawaNow is intended for educational, spiritual, and personal-use purposes.</p>
          <div className="bg-muted p-6 rounded-2xl border border-border/50">
            <p className="font-bold text-foreground mb-4">Important:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm italic">
              <li>The content provided on TilawaNow is not a substitute for formal religious education or scholarly guidance</li>
              <li>AI-generated explanations are not authoritative fatwas, legal rulings, or certified scholarly opinions</li>
              <li>Interpretations may vary across schools of thought, traditions, and scholarly approaches</li>
              <li>Users should consult qualified scholars or teachers for matters requiring religious authority or detailed jurisprudence</li>
            </ul>
          </div>
          <p>You are responsible for how you interpret and apply any content viewed or generated on the platform.</p>
        </div>
      )
    },
    {
      title: "6. AI & Third-Party Service Disclaimer",
      content: (
        <div className="space-y-4">
          <p>TilawaNow may provide AI-generated responses using third-party services like OpenRouter and Puter.js. You understand and agree that:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base italic">
            <li>AI output may be incomplete, inaccurate, or misleading</li>
            <li>We do not guarantee the correctness of any AI-generated content</li>
            <li>You use AI features at your own discretion and risk</li>
          </ul>
        </div>
      )
    },
    {
      title: "7. User Eligibility",
      content: (
        <p>You must be at least 13 years old to use TilawaNow. By using the platform, you represent that you meet this age requirement.</p>
      )
    },
    {
      title: "7. Intellectual Property",
      content: (
        <div className="space-y-4">
          <p>Unless otherwise stated:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>TilawaNow’s design, interface, layout, branding, features, source code, and overall presentation belong to us or our licensors</li>
            <li>You may not copy, reproduce, modify, distribute, sell, resell, license, or exploit any part of the platform without our written permission</li>
          </ul>
          <p>Any Qur’an text, recitations, translations, or other source materials displayed on the platform may belong to their respective rights holders or sources. Where applicable, we may identify the source, reciter, translator, publisher, or content provider.</p>
          <p>Users may view and use the service for personal, non-commercial purposes only, subject to these Terms.</p>
        </div>
      )
    },
    {
      title: "8. User Content",
      content: (
        <div className="space-y-4">
          <p>“User Content” includes notes, bookmarks, prompts, progress data, and any other content you submit or create through the platform.</p>
          <p>You retain ownership of your User Content to the extent permitted by law. By submitting User Content, you grant us a limited, non-exclusive, worldwide license to host, store, process, transmit, display, and use that content only as needed to operate, improve, and maintain TilawaNow.</p>
          <p>You are solely responsible for your User Content, and we are not liable for its accuracy, legality, or reliability.</p>
        </div>
      )
    },
    {
      title: "9. Service Availability",
      content: (
        <p>We do not guarantee that TilawaNow will be available at all times. The service may experience downtime, maintenance interruptions, or technical failures. We are not responsible for interruptions caused by hosting, third-party services, or other technical limitations.</p>
      )
    },
    {
      title: "10. Donations and Support",
      content: (
        <p>TilawaNow is free to use. Users may voluntarily support the platform through donations. Donations are optional and do not unlock ownership rights or guaranteed service levels. Any donation processing is handled by third-party providers whose separate terms may apply.</p>
      )
    },
    {
      title: "11. Third-Party Services",
      content: (
        <div className="space-y-4">
          <p>TilawaNow may rely on third-party services like Supabase and OpenRouter. We are not responsible for their availability, performance, or security failures. Your use of those services is governed by their own terms and privacy policies.</p>
        </div>
      )
    },
    {
      title: "12. Termination",
      content: (
        <p>We may suspend or terminate your access to TilawaNow at any time for violation of these Terms, misuse, security threats, or legal requirements. You may delete your account at any time through account settings.</p>
      )
    },
    {
      title: "13. Limitation of Liability",
      content: (
        <p>To the fullest extent permitted by law, TilawaNow is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Your use of TilawaNow is at your own risk.</p>
      )
    },
    {
      title: "14. Indemnification",
      content: (
        <p>You agree to indemnify and hold harmless TilawaNow and its team from any claims, damages, liabilities, or expenses (including legal fees) arising from your use of the service or your violation of these Terms.</p>
      )
    },
    {
      title: "16. Severability",
      content: (
        <p>If any provision of these Terms is found to be invalid or unenforceable by a court, the remaining provisions will continue in full force and effect.</p>
      )
    },
    {
      title: "17. Disclaimer of Warranties",
      content: (
        <p>TilawaNow is provided "as is". We make no warranties regarding accuracy or fitness for a particular purpose. Content is for educational use and does not constitute professional advice.</p>
      )
    },
    {
      title: "18. Governing Law",
      content: (
        <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the competent courts in India.</p>
      )
    },
    {
      title: "19. Changes to These Terms",
      content: (
        <p>We may update or modify these Terms at any time. Your continued use of TilawaNow after changes are posted means you accept the revised Terms.</p>
      )
    },
    {
      title: "18. Contact Information",
      content: (
        <div className="space-y-4 text-sm md:text-base">
          <p>For questions about these Terms, contact us at:</p>
          <div className="flex flex-col gap-2 italic">
            <a href="mailto:tilawanow@gmail.com" className="font-semibold text-primary hover:underline flex items-center gap-2">
              <Mail className="w-4 h-4" />
              tilawanow@gmail.com
            </a>
            <p className="text-muted-foreground text-xs font-mono lowercase">Website: TilawaNow.vercel.app</p>
          </div>
        </div>
      )
    },
    {
      title: "18. Entire Agreement",
      content: (
        <p>These Terms, together with our Privacy Policy, form the entire agreement between you and TilawaNow and supersede any prior understandings.</p>
      )
    }
  ];

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
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 whitespace-nowrap">Terms & Conditions.</h1>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase bg-muted/50 w-fit px-4 py-2 rounded-md border border-border/50">
            <Clock className="w-3 h-3" />
            <span>Effective: {effectiveDate}</span>
          </div>
        </header>

        <div className="space-y-16 text-muted-foreground leading-relaxed text-sm md:text-base">
          {/* Header text */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Terms & Conditions for TilawaNow</h2>
            <p className="text-lg text-foreground/80 font-medium italic">
              Effective Date: {effectiveDate}
            </p>
            <p>
              These Terms & Conditions (“Terms”) govern your access to and use of TilawaNow (“TilawaNow,” “we,” “our,” or “us”). By accessing or using TilawaNow, you agree to be bound by these Terms. If you do not agree, do not use the service.
            </p>
            <p>
              TilawaNow is a free-to-use platform designed to help users read, listen to, understand, and build a meaningful relationship with the Holy Qur’an. The platform may also include AI-assisted explanations, bookmarking, progress tracking, and related features.
            </p>
          </section>

          {/* Main sections loop */}
          <div className="space-y-20">
            {sections.map((section, idx) => (
              <section key={idx} className="space-y-6">
                <h2 className="text-lg font-bold tracking-tight border-b border-border pb-4 w-fit pr-12">
                  {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <footer className="pt-24 border-t border-border mt-32 leading-relaxed opacity-60 text-[10px] uppercase tracking-widest">
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

export default TermsConditions;

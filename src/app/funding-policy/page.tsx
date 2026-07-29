"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info, Heart } from "lucide-react";
import Link from "next/link";
import { useSmartBack } from "@/hooks/use-smart-back";

const FundingPolicy = () => {
  const router = useRouter();
  const handleBack = useSmartBack("/home");
  const [showRazorpayPolicy, setShowRazorpayPolicy] = useState(false);

  const sections = [
    {
      title: "1. Project Origins & Community",
      content: (
        <div className="space-y-4">
          <p>
            TilawaNow was created by Muhammed Risvan after months of dedicated work. It is not a registered corporation or NGO; it is purely a community-owned, open-source project. We actively encourage anyone to contribute—whether technically by writing code, or financially to help us grow.
          </p>
          <p>
            Because TilawaNow is not a registered NGO, contributions do not qualify for tax deductions (such as the 80G certificate in India) and are processed purely as voluntary development support.
          </p>
        </div>
      )
    },
    {
      title: "2. Infrastructure & Future Goals",
      content: (
        <div className="space-y-4">
          <p>
            Currently, the project runs entirely on free-tier services (including Vercel and Supabase) and utilizes the Quran.com API as our primary data source, hosted on a subdomain. 
          </p>
          <p>
            As our community and traffic grow, we must shift to paid, fast, and reliable resources. Your funding directly helps us purchase a dedicated domain name, upgrade our servers, and build complex features like personalized user dashboards.
          </p>
          <p>
            Since all received contributions are voluntary tips allocated directly to these hosting and development costs, all transactions are final and non-refundable.
          </p>
        </div>
      )
    },
    {
      title: "3. Transparency & Reporting",
      content: (
        <div className="space-y-4">
          <p>
            We believe that if the community funds the project, the community deserves to know where every penny goes. Once we begin receiving sufficient funding, we are committed to publishing transparent financial updates on this site on a weekly or monthly basis.
          </p>
        </div>
      )
    },
    {
      title: "4. Corporate Sponsorship",
      content: (
        <div className="space-y-4">
          <p>
            We are highly open to corporate sponsors who wish to support the Ummah. To show our appreciation without cluttering the core user experience, corporate members will have their logo/text link featured in a dedicated 'Sponsors' section in our GitHub README, as well as a clean, unobtrusive placement on our Donation page.
          </p>
        </div>
      )
    },
    {
      title: "5. Managing Subscriptions",
      content: (
        <div className="space-y-4">
          <p>
            You are always in control of your monthly donations. There is no minimum commitment, and monthly support can be cancelled at any time with no questions asked.
          </p>
          <p>
            You can easily remove or cancel your subscription directly from your bank's app (or UPI apps for users in India). Alternatively, you can reach out to us via email or our <Link href="/contact" className="underline text-foreground">Contact page</Link> and we will cancel it for you immediately.
          </p>
        </div>
      )
    },
    {
      title: "6. Secure Payments (Razorpay)",
      content: (
        <div className="space-y-4">
          <p>
            All financial transactions are securely processed through Razorpay. Our secure gateway supports UPI, Netbanking, and all major Indian and international debit/credit cards.
          </p>
          <p>
            We do not store your credit card or bank details on our servers.
          </p>
          <button 
            onClick={() => setShowRazorpayPolicy(true)}
            className="text-xs font-bold uppercase tracking-widest text-premium-accent hover:text-foreground transition-colors underline underline-offset-4"
          >
            View Razorpay Policy Details
          </button>
        </div>
      )
    },
    {
      title: "7. Unconditional Free Access",
      content: (
        <div className="space-y-4">
          <p>
            TilawaNow will always remain 100% free and open-source. Financial contributions will never grant special access to "premium" features, nor will any part of the core user experience ever be locked behind a paywall.
          </p>
          <p>
            Your support simply ensures the platform stays fast, modern, and completely ad-free for the entire Ummah.
          </p>
        </div>
      )
    }
  ];

  return (
    <>
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
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Funding Policy.</h1>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase bg-muted/50 w-fit px-4 py-2 rounded-md border border-border/50">
              <Info className="w-3 h-3" />
              <span>Transparency & Trust</span>
            </div>
          </header>

          <div className="space-y-16 text-muted-foreground leading-relaxed text-sm md:text-base">
            
            <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-12">
              TilawaNow is built with a simple, uncompromising vision: to create the most beautiful, distraction-free environment for reading and reflecting on the Qur'an.
            </p>

            <div className="space-y-24">
              {sections.map((section, idx) => (
                <section key={idx} className="space-y-8">
                  <h2 className="text-lg font-bold tracking-tight border-b border-border pb-4 w-fit pr-12 text-foreground">
                    {section.title}
                  </h2>
                  <div className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </div>
                </section>
              ))}

              {/* Closing Line */}
              <section className="pt-24 border-t border-border">
                <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight italic">
                  “To protect this vision, we have established a strict funding policy that ensures the platform remains free forever.”
                </p>
                <div className="mt-12 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 leading-loose max-w-lg">
                    If you have questions, <Link href="/contact" className="underline hover:text-foreground transition-colors">contact us</Link>.
                    <br />
                    © {new Date().getFullYear()} TilawaNow Team
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Heart className="w-4 h-4 text-primary fill-primary/10" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Policy Modal */}
      {showRazorpayPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border/40 rounded-xl p-8 max-w-lg w-full shadow-lg relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-foreground">Razorpay Gateway Policy</h3>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                TilawaNow uses Razorpay as a third-party payment gateway to ensure your donations are processed with the highest security standards. 
              </p>
              <p>
                When you make a payment, your sensitive data (like card numbers or UPI IDs) is handled entirely by Razorpay's PCI-DSS compliant servers. TilawaNow never sees or stores this data. We only receive a secure token to confirm your donation status.
              </p>
              <p>
                For recurring (monthly) donations, Razorpay securely manages the billing cycle according to RBI guidelines (for Indian users) and global financial standards. You retain full control to revoke this mandate directly from your bank or UPI app at any time.
              </p>
            </div>
            <button 
              onClick={() => setShowRazorpayPolicy(false)}
              className="mt-8 w-full py-3 bg-foreground text-background font-bold rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FundingPolicy;

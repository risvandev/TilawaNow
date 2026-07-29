"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle, Heart, ChevronLeft, Sparkles, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/Footer";
import { useSmartBack } from "@/hooks/use-smart-back";


const Contact = () => {
  const navigate = useRouter();
  const handleBack = useSmartBack("/home");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Removed Donate Dialog State and Razorpay logic in favor of /donate page

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to send");

      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: error.message || "Please check your connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Background Glows - Mac Style */}
      <div className="absolute top-[-10%] left-[5%] w-[50vw] h-[50vh] rounded-full bg-premium-accent/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-5%] w-[45vw] h-[45vh] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none z-0" />

      <div className="flex-1 container mx-auto px-4 md:px-6 py-10 md:py-16 relative z-10 max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col items-start mb-12 animate-fade-in">
          <button
            onClick={handleBack}
            className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-all duration-300 px-4 py-1.5 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Return</span>
          </button>

          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-accent mb-1">
            Get in touch
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Contact & Support
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1 max-w-xl">
            Have questions, feedback, or need help? Reach out and connect with our team.
          </p>
        </div>

        {/* Main Grid: Bento style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1 & 2: Contact Form Card */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl animate-fade-in-up">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-premium-accent" />
              Send a Message
            </h2>

            {submitted ? (
              <div className="text-center py-12 animate-fade-in-up">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Message Received</h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
                  Thank you for reaching out! We've received your message and will respond as soon as possible.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button variant="outline" size="lg" className="rounded-xl border-white/10" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                  <Button variant="ghost" size="lg" className="rounded-xl" onClick={() => navigate.back()}>
                    Return Home
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="h-12 bg-black/25 border border-white/10 focus-visible:ring-1 focus-visible:ring-premium-accent/30 focus-visible:border-premium-accent/40 hover:bg-black/35 rounded-xl px-4 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="h-12 bg-black/25 border border-white/10 focus-visible:ring-1 focus-visible:ring-premium-accent/30 focus-visible:border-premium-accent/40 hover:bg-black/35 rounded-xl px-4 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Feedback / Feature Request / Support"
                    required
                    className="h-12 bg-black/25 border border-white/10 focus-visible:ring-1 focus-visible:ring-premium-accent/30 focus-visible:border-premium-accent/40 hover:bg-black/35 rounded-xl px-4 transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind..."
                    required
                    rows={5}
                    className="bg-black/25 border border-white/10 focus-visible:ring-1 focus-visible:ring-premium-accent/30 focus-visible:border-premium-accent/40 hover:bg-black/35 rounded-xl p-4 transition-all text-sm resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 rounded-xl text-sm font-semibold shadow-lg shadow-premium-accent/10 hover:shadow-premium-accent/20 hover:scale-[1.005] transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Column 3: Sidebar Bento Modules */}
          <div className="space-y-6 lg:col-span-1 animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
            {/* Card 1: WhatsApp Community connection */}
            <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl p-5 hover:bg-emerald-500/[0.06] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-4">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.457 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">WhatsApp Community</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Join our official community for updates, reflections, support, and to connect with the TilawaNow family.
                </p>
              </div>
              <Button
                className="w-full gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold rounded-xl h-10 border-none text-xs"
                onClick={() => window.open("https://chat.whatsapp.com/Hhd9xE0gFqFEOciGGq6QxS", "_blank")}
              >
                Join TilawaNow Family
              </Button>
            </div>


          </div>
        </div>

        {/* Support Section - Clean Bento Long Layout */}
        <div className="mt-16 bg-gradient-to-r from-premium-accent/[0.03] to-blue-500/[0.03] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-premium-accent/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-premium-accent/10 flex items-center justify-center mb-6 shadow-inner text-premium-accent">
                <Heart className="w-6 h-6 fill-current/20" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-3">Support TilawaNow</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                TilawaNow is built and maintained voluntarily to spread the light of the Quran. If you find this platform beneficial, your support keeps it <strong className="text-foreground">free forever</strong>.
              </p>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="rounded-xl px-8 h-12 text-sm shadow-xl shadow-premium-accent/10 hover:shadow-premium-accent/25 shrink-0"
              onClick={() => navigate.push("/donate")}
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Donate Now
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>




    </div>
  );
};

export default Contact;

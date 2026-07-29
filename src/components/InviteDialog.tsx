import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function InviteDialog() {
    const [email, setEmail] = useState("");
    const [copied, setCopied] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const inviteLink = typeof window !== "undefined" ? window.location.origin + "/account" : "https://tilawanow.vercel.app/account";

    const handleEmailInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSending(true);
        try {
            const response = await fetch("/api/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_email: email,
                    from_name: user?.user_metadata?.full_name || user?.email || "A friend",
                    invite_link: inviteLink,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Invite Sent!",
                    description: `Invitation successfully sent to ${email}`,
                });
                setEmail("");
            } else {
                throw new Error(data.error || "Failed to send invite");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Link Copied",
            description: "Invite link copied to clipboard.",
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="w-10 h-10 md:w-auto md:h-10 md:px-4 rounded-full md:rounded-xl border-white/10 bg-secondary/40 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all text-xs md:text-sm font-semibold tracking-wide shadow-lg shrink-0 gap-0 md:gap-2">
                    <Share2 className="w-4 h-4 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Invite Friends</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card border-white/10">
                <DialogHeader>
                    <DialogTitle>Invite Friends</DialogTitle>
                    <DialogDescription>
                        Share the journey with your loved ones.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={inviteLink}
                            readOnly
                            className="bg-secondary/50 border-white/10"
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={copyLink}>
                        <span className="sr-only">Copy</span>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or send email</span>
                    </div>
                </div>

                <form onSubmit={handleEmailInvite} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Friend's Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="friend@example.com"
                                className="pl-9 bg-secondary/50 border-white/10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="submit" variant="hero" className="w-full" disabled={isSending}>
                            {isSending ? "Sending Invite..." : "Send Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

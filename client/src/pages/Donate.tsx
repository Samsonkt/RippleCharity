import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const DonationForm = ({ channelId }: { channelId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(10);
  const [donationType, setDonationType] = useState("oneTime");
  const [user, setUser] = useState<any>(null);
  
  // Get user from localStorage
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);
  const [location, setLocation] = useLocation();

  const { data: channel } = useQuery({
    queryKey: [`/api/channel/${channelId}`],
    queryFn: async () => {
      const res = await fetch(`/api/channel/${channelId}`);
      if (!res.ok) throw new Error('Failed to fetch channel');
      return res.json();
    },
    enabled: !!channelId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Failed",
        description: "Stripe hasn't loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      toast({
        title: "Payment Failed",
        description: "Card element not found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a payment intent on the server
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          channelId,
          userId: user?.id
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Something went wrong');
      }

      const { clientSecret } = await res.json();

      // Confirm the payment with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.username || 'Anonymous Donor',
            email: user?.email
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Donation Successful",
          description: `Thank you for your ${amount} donation to ${channel?.name}!`,
          variant: "default",
        });

        // Redirect to the channel page after successful donation
        setTimeout(() => {
          setLocation('/channels');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Donation Failed",
        description: error.message || "Something went wrong with your donation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const donationOptions = [
    { value: 5, label: "$5" },
    { value: 10, label: "$10" },
    { value: 25, label: "$25" },
    { value: 50, label: "$50" },
    { value: 100, label: "$100" },
  ];

  if (!channel) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Donate to {channel.name}</h2>
        <p className="text-neutral-600 mt-1">100% of your donation goes directly to support this cause</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount" className="text-neutral-700">Donation Amount</Label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {donationOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={amount === option.value ? "default" : "outline"}
                className={amount === option.value ? "bg-primary text-white" : ""}
                onClick={() => setAmount(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="mt-3">
            <Label htmlFor="custom-amount" className="text-sm text-neutral-600">Custom Amount ($)</Label>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-neutral-700">Donation Type</Label>
          <RadioGroup
            value={donationType}
            onValueChange={setDonationType}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oneTime" id="one-time" />
              <Label htmlFor="one-time">One Time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" disabled />
              <Label htmlFor="monthly" className="text-neutral-400">Monthly (Coming Soon)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="mt-6">
          <Label htmlFor="card-element" className="text-neutral-700">Payment Information</Label>
          <div className="mt-2 p-3 border border-neutral-300 rounded-md bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-primary hover:bg-blue-500 mt-8"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            Processing...
          </span>
        ) : (
          `Donate $${amount}`
        )}
      </Button>

      <p className="text-center text-sm text-neutral-500 mt-4">
        Secure payment processed by Stripe. Your card details are encrypted and never stored on our servers.
      </p>
    </form>
  );
};

export default function Donate({ params }: { params?: { channelId: string } }) {
  // Get channel ID from route params
  const channelId = params?.channelId;

  if (!channelId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">No Channel Selected</h2>
        <p className="text-neutral-600 mb-6">
          Please select a charity channel from the Channels page to make a donation.
        </p>
        <Button onClick={() => window.location.href = '/channels'}>
          Browse Channels
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <Elements stripe={stripePromise}>
        <DonationForm channelId={channelId} />
      </Elements>
    </div>
  );
}
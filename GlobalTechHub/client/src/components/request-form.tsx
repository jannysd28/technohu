import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { insertRequestSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestFormProps {
  onComplete: () => void;
  selectedSellerId?: number;
}

const requestFormSchema = insertRequestSchema.omit({ 
  buyerId: true,
  createdAt: true,
  status: true
}).extend({
  price: z.coerce.number().min(1, "Price must be at least $1"),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm({ onComplete, selectedSellerId }: RequestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculating, setCalculating] = useState(false);

  // Fetch available sellers
  const { data: sellers = [] } = useQuery<User[]>({
    queryKey: ["/api/sellers", "active"],
    queryFn: async () => {
      const response = await fetch("/api/sellers?status=active");
      if (!response.ok) {
        throw new Error("Failed to fetch sellers");
      }
      return response.json();
    },
  });

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      sellerId: selectedSellerId || 0,
    },
  });

  // Create request mutation
  const requestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      // Convert price to cents for storage
      const dataToSend = { 
        ...data, 
        price: data.price * 100,
        buyerId: user!.id,
      };
      
      const res = await apiRequest("POST", "/api/requests", dataToSend);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request submitted",
        description: "Your request has been sent to the seller.",
      });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Watch price to calculate platform fee
  const currentPrice = form.watch("price");
  const platformFee = currentPrice * 0.1; // 10% platform fee
  const totalPrice = currentPrice + platformFee;

  // Generate avatar fallback (initials) for a seller
  const getSellerInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Find seller by ID
  const getSellerById = (id: number) => {
    return sellers.find(seller => seller.id === id);
  };

  const onSubmit = (data: RequestFormValues) => {
    // Simulate a small delay to show calculating state
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      requestMutation.mutate(data);
    }, 800);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!selectedSellerId && (
          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Seller</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a seller" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id.toString()}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={seller.avatar} />
                            <AvatarFallback>{getSellerInitials(seller.name)}</AvatarFallback>
                          </Avatar>
                          {seller.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Custom Web Scraper Script" {...field} />
              </FormControl>
              <FormDescription>
                Give your request a clear, descriptive title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what you need, include specific requirements, features, and any relevant details..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Be as specific as possible about your requirements
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposed Budget (USD)</FormLabel>
              <FormControl>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    className="pl-7"
                    {...field}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value));
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Your proposed budget for this request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("price") > 0 && (
          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Cost Breakdown</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Proposed Budget:</span>
                <span className="text-gray-900">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee (10%):</span>
                <span className="text-gray-900">${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {selectedSellerId && getSellerById(selectedSellerId) && (
          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Seller</h4>
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getSellerById(selectedSellerId)?.avatar} />
                <AvatarFallback>{getSellerInitials(getSellerById(selectedSellerId)?.name || "")}</AvatarFallback>
              </Avatar>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-900">{getSellerById(selectedSellerId)?.name}</p>
                <p className="text-xs text-gray-500">{getSellerById(selectedSellerId)?.statusMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={requestMutation.isPending || calculating}
          >
            {(requestMutation.isPending || calculating) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {calculating ? "Calculating..." : "Submitting..."}
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

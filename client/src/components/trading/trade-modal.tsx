import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const tradeFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  type: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MARKET", "LIMIT", "STOP"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().optional(),
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeModal({ open, onOpenChange }: TradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      symbol: "",
      type: "BUY",
      orderType: "MARKET",
      quantity: 1,
    },
  });

  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      // Mock stock lookup - in real app would query stocks table
      const mockStockId = 1; // AAPL
      const totalAmount = (data.quantity * (data.price || 100)).toString();
      
      return apiRequest("POST", "/api/trades", {
        userId: 1,
        stockId: mockStockId,
        type: data.type,
        quantity: data.quantity,
        price: (data.price || 100).toString(),
        totalAmount,
        orderType: data.orderType,
      });
    },
    onSuccess: () => {
      toast({
        title: "Trade Placed",
        description: "Your trade order has been placed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/1"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade order.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TradeFormData) => {
    tradeMutation.mutate(data);
  };

  const watchOrderType = form.watch("orderType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark-card border-dark-border w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Quick Trade</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="AAPL"
                      className="bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700/50 border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark-card border-dark-border">
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Order Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700/50 border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark-card border-dark-border">
                        <SelectItem value="MARKET">Market</SelectItem>
                        <SelectItem value="LIMIT">Limit</SelectItem>
                        <SelectItem value="STOP">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      className="bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchOrderType !== "MARKET" && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        className="bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 border-dark-border text-gray-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={tradeMutation.isPending}
                className="flex-1 bg-primary-blue text-white hover:bg-blue-600"
              >
                {tradeMutation.isPending ? "Placing..." : "Place Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

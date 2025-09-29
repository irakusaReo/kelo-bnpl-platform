"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Users, Store, Smartphone, Shield, TrendingUp, Globe } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("customers");

  const features = {
    customers: [
      {
        icon: Smartphone,
        title: "Instant Approval",
        description: "Get approved for loans in minutes with our AI-powered credit scoring",
      },
      {
        icon: Shield,
        title: "Secure & Transparent",
        description: "Blockchain technology ensures all transactions are secure and transparent",
      },
      {
        icon: TrendingUp,
        title: "Build Credit",
        description: "Repay on time and build your credit score for better loan terms",
      },
    ],
    merchants: [
      {
        icon: Users,
        title: "Increase Sales",
        description: "Offer BNPL options and increase your average order value by 40%",
      },
      {
        icon: Store,
        title: "Easy Integration",
        description: "Simple API integration with your existing e-commerce platform",
      },
      {
        icon: Globe,
        title: "Multi-Chain Support",
        description: "Accept payments in multiple cryptocurrencies and fiat currencies",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
              <span className="text-xl font-bold">Kelo</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" passHref>
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/register" passHref>
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          Built for Kenya 🇰🇪
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Buy Now, Pay Later
          <br />
          <span className="text-gray-900 dark:text-gray-100">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Experience the future of flexible payments with Kelo. Get instant approval for purchases and pay in manageable installments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" passHref>
            <Button size="lg" className="text-lg px-8">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/merchant-register" passHref>
            <Button variant="outline" size="lg" className="text-lg px-8">
              For Merchants
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Kelo?</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discover the benefits that make Kelo the preferred BNPL solution in Kenya
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers">For Customers</TabsTrigger>
            <TabsTrigger value="merchants">For Merchants</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customers" className="mt-8">
            <div className="grid md:grid-cols-3 gap-6">
              {features.customers.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="merchants" className="mt-8">
            <div className="grid md:grid-cols-3 gap-6">
              {features.merchants.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">1,200+</div>
              <div className="text-gray-600 dark:text-gray-300">Merchant Partners</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">KES 500M+</div>
              <div className="text-gray-600 dark:text-gray-300">Loans Processed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Join thousands of customers and merchants already using Kelo
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" passHref>
            <Button size="lg" className="text-lg px-8">
              Sign Up as Customer
            </Button>
          </Link>
          <Link href="/auth/merchant-register" passHref>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Register as Merchant
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                <span className="text-xl font-bold">Kelo</span>
              </div>
              <p className="text-gray-400">
                Modern BNPL platform designed for the Kenyan market.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How it Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Kelo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calculator, BookOpen } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Magnetfeld-Rechner</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                size="sm"
                data-testid="button-nav-calculator"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Rechner
              </Button>
            </Link>
            
            <Link href="/documentation">
              <Button
                variant={location === "/documentation" ? "default" : "ghost"}
                size="sm"
                data-testid="button-nav-documentation"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Dokumentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

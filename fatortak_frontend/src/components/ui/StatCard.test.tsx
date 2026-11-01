import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wallet } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

describe("StatCard", () => {
  it("renders the title, value and subtitle", () => {
    render(
      <StatCard
        title="Collected revenue"
        value="12,500.00"
        subtitle="This month"
        icon={Wallet}
        tone="success"
      />
    );

    expect(screen.getByText("Collected revenue")).toBeInTheDocument();
    expect(screen.getByText("12,500.00")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });

  it("renders a positive trend label", () => {
    render(
      <StatCard
        title="Invoices"
        value={12}
        icon={Wallet}
        trend={8.5}
        trendLabel="vs last month"
      />
    );

    expect(screen.getByText("8.5%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders a negative trend label", () => {
    render(
      <StatCard
        title="Overdue"
        value={3}
        icon={Wallet}
        trend={-4}
        trendLabel="vs last month"
      />
    );

    expect(screen.getByText("4%")).toBeInTheDocument();
  });
});


import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Building2, DollarSign, Mail, Palette, Clock, FileText } from "lucide-react";

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" }
];

const colors = [
  "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

const timeRoundingIncrements = [
  { value: "none", label: "No Rounding" },
  { value: "15_min", label: "15 Minutes" },
  { value: "30_min", label: "30 Minutes" },
  { value: "1_hour", label: "1 Hour" }
];

const timeRoundingDirections = [
  { value: "up", label: "Always Round Up" },
  { value: "down", label: "Always Round Down" },
  { value: "nearest", label: "Round to Nearest" }
];

export default function ClientForm({ client, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: client?.name || "",
    contact_email: client?.contact_email || "",
    hourly_rate: client?.hourly_rate || "",
    currency: client?.currency || "USD",
    color: client?.color || colors[0],
    status: client?.status || "active",
    service_details: client?.service_details || "",
    time_rounding_increment: client?.time_rounding_increment || "none",
    time_rounding_direction: client?.time_rounding_direction || "nearest"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      hourly_rate: parseFloat(formData.hourly_rate)
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            {client ? "Edit Client" : "Add New Client"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Client Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter client name"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="client@example.com"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate *
                </Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-semibold text-slate-700">
                  Currency
                </Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange("currency", value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Rounding Settings
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rounding_increment" className="text-sm text-slate-600">
                    Rounding Increment
                  </Label>
                  <Select 
                    value={formData.time_rounding_increment} 
                    onValueChange={(value) => handleInputChange("time_rounding_increment", value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRoundingIncrements.map((increment) => (
                        <SelectItem key={increment.value} value={increment.value}>
                          {increment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rounding_direction" className="text-sm text-slate-600">
                    Rounding Direction
                  </Label>
                  <Select 
                    value={formData.time_rounding_direction} 
                    onValueChange={(value) => handleInputChange("time_rounding_direction", value)}
                    disabled={formData.time_rounding_increment === "none"}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRoundingDirections.map((direction) => (
                        <SelectItem key={direction.value} value={direction.value}>
                          {direction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <strong>Time Rounding:</strong> When enabled, time entries will be automatically rounded according to your settings. 
                This is commonly used for billing purposes to standardize time increments.
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Client Color
              </Label>
              <div className="flex gap-3 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === color ? 'border-slate-400 scale-110 shadow-lg' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleInputChange("color", color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-slate-700">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_details" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Service Details
              </Label>
              <Textarea
                id="service_details"
                value={formData.service_details}
                onChange={(e) => handleInputChange("service_details", e.target.value)}
                placeholder="Describe the services provided to this client, scope of work, or any special arrangements..."
                className="h-24 resize-none"
              />
              <div className="text-xs text-slate-500">
                Add notes about the services you provide, billing arrangements, or any special considerations for this client.
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                {client ? "Update Client" : "Create Client"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

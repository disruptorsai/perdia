import React, { useState, useEffect } from "react";
import { Client } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings2, Building2 } from "lucide-react";
import ClientList from "../clients/ClientList";
import ClientForm from "../clients/ClientForm";

export default function AdminTab() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const clientData = await Client.list("name");
      setClients(clientData);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
    setLoading(false);
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        await Client.update(editingClient.id, clientData);
      } else {
        await Client.create(clientData);
      }
      
      setShowClientForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = async (clientId) => {
    try {
      await Client.delete(clientId);
      loadClients();
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-emerald-600" />
            Admin Settings
          </h1>
          <p className="text-slate-600 mt-1">Manage clients, rates, and system configuration</p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null);
            setShowClientForm(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Client Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientList
              clients={clients}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {showClientForm && (
        <ClientForm
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={() => {
            setShowClientForm(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
}
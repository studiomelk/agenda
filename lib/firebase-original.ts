"use client";

import { useEffect, useState } from "react";

const firebaseConfig = {
  "projectId": "studio-5279929289-498c5",
  "appId": "1:508932506907:web:39fdbb436a570e2a6fbfbe",
  "apiKey": "AIzaSyDpRvSlrfpynbpoCJItut1kfC7ePe9Ym6U",
  "authDomain": "studio-5279929289-498c5.firebaseapp.com",
  "messagingSenderId": "508932506907"
};

type StudioDocument = Record<string, unknown> & { id: string };

export type OriginalStudioData = {
  events: StudioDocument[];
  teamMembers: StudioDocument[];
  clients: StudioDocument[];
  orders: StudioDocument[];
  transactions: StudioDocument[];
  requests: StudioDocument[];
  memos: StudioDocument[];
  contractTemplates: StudioDocument[];
  loading: boolean;
  error: string | null;
};

const emptyData: OriginalStudioData = {
  events: [], teamMembers: [], clients: [], orders: [], transactions: [],
  requests: [], memos: [], contractTemplates: [], loading: true, error: null,
};

type FirestoreValue = {
  stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean;
  timestampValue?: string; nullValue?: null; referenceValue?: string;
  arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> };
  geoPointValue?: { latitude: number; longitude: number };
};

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields ?? {});
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

async function anonymousToken(signal: AbortSignal) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }), signal,
  });
  const data = await response.json() as { idToken?: string; error?: { message?: string } };
  if (!response.ok || !data.idToken) throw new Error(data.error?.message || "Não foi possível autenticar no Firebase original.");
  return data.idToken;
}

async function readCollection(name: string, token: string, signal: AbortSignal) {
  const documents: StudioDocument[] = [];
  let pageToken = "";
  do {
    const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${name}?pageSize=300${suffix}`, {
      headers: { authorization: `Bearer ${token}` }, signal, cache: "no-store",
    });
    const data = await response.json() as {
      documents?: Array<{ name: string; fields?: Record<string, FirestoreValue> }>;
      nextPageToken?: string; error?: { message?: string };
    };
    if (!response.ok) throw new Error(data.error?.message || `Falha ao ler ${name}.`);
    documents.push(...(data.documents ?? []).map((document) => ({
      id: document.name.split("/").pop() || "", ...decodeFields(document.fields ?? {}),
    })));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}

export function useOriginalStudioData() {
  const [data, setData] = useState<OriginalStudioData>(emptyData);

  useEffect(() => {
    const controller = new AbortController();
    const collections = {
      events: "events", teamMembers: "team_members", clients: "clientes", orders: "pedidos",
      transactions: "transactions", requests: "solicitacoes", memos: "memos", contractTemplates: "contract_templates",
    } as const;

    (async () => {
      try {
        const token = await anonymousToken(controller.signal);
        const entries = await Promise.all(Object.entries(collections).map(async ([key, name]) => [
          key, await readCollection(name, token, controller.signal),
        ] as const));
        if (!controller.signal.aborted) setData({ ...emptyData, ...Object.fromEntries(entries), loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setData((current) => ({
          ...current, loading: false, error: error instanceof Error ? error.message : "Falha ao carregar o banco original.",
        }));
      }
    })();

    return () => controller.abort();
  }, []);

  return data;
}


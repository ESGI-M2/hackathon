"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import GeneratedFormPage from "./generated-form";

export default function FormBuilderPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? undefined;
  return <GeneratedFormPage templateId={id} />;
}

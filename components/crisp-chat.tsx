"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("c8319445-96ea-41bd-8b88-4788fe613e87");
  }, []);

  return null;
};
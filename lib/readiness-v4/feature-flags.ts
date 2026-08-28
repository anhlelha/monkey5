import { prisma } from "../prisma";

export interface ReadinessV4Flags {
  computeEnabled: boolean;
  shadowEnabled: boolean;
  readEnabled: boolean;
  persistLegacyEnabled: boolean;
}

export async function getReadinessV4Flags(): Promise<ReadinessV4Flags> {
  const row = await prisma.appSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return {
    computeEnabled: row.readinessV4ComputeEnabled,
    shadowEnabled: row.readinessV4ShadowEnabled,
    readEnabled: row.readinessV4ReadEnabled,
    persistLegacyEnabled: row.readinessV4PersistLegacyEnabled,
  };
}

export async function setReadinessV4Flags(flags: Partial<ReadinessV4Flags>): Promise<ReadinessV4Flags> {
  const row = await prisma.appSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      readinessV4ComputeEnabled: flags.computeEnabled ?? false,
      readinessV4ShadowEnabled: flags.shadowEnabled ?? false,
      readinessV4ReadEnabled: flags.readEnabled ?? false,
      readinessV4PersistLegacyEnabled: flags.persistLegacyEnabled ?? true,
    },
    update: {
      readinessV4ComputeEnabled: flags.computeEnabled,
      readinessV4ShadowEnabled: flags.shadowEnabled,
      readinessV4ReadEnabled: flags.readEnabled,
      readinessV4PersistLegacyEnabled: flags.persistLegacyEnabled,
    },
  });
  return {
    computeEnabled: row.readinessV4ComputeEnabled,
    shadowEnabled: row.readinessV4ShadowEnabled,
    readEnabled: row.readinessV4ReadEnabled,
    persistLegacyEnabled: row.readinessV4PersistLegacyEnabled,
  };
}

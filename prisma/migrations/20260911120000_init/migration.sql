-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'RECEPTION', 'TECHNICIAN');
CREATE TYPE "JobStatus" AS ENUM ('PRZYJETE', 'DIAGNOSTYKA', 'W_NAPRAWIE', 'OCZEKUJE_NA_CZESCI', 'GOTOWE_DO_ODBIORU', 'WYDANE', 'ANULOWANE');
CREATE TYPE "OfferType" AS ENUM ('MULTI', 'PRODUCT_CARD');
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "CalendarSyncStatus" AS ENUM ('DISCONNECTED', 'LOCAL_ONLY', 'SYNCED', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PRZYJETE',
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "deviceType" TEXT NOT NULL,
    "deviceBrand" TEXT,
    "deviceModel" TEXT NOT NULL,
    "serialNumber" TEXT,
    "accessories" TEXT,
    "issueDescription" TEXT NOT NULL,
    "devicePinEnc" TEXT,
    "devicePasswordEnc" TEXT,
    "notes" TEXT,
    "technicianId" TEXT,
    "promisedPickupAt" TIMESTAMP(3),
    "chargeGrosze" INTEGER NOT NULL DEFAULT 0,
    "googleEventId" TEXT,
    "calendarSync" "CalendarSyncStatus" NOT NULL DEFAULT 'LOCAL_ONLY',
    "calendarError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "OfferType" NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "validUntil" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "vatRate" INTEGER NOT NULL DEFAULT 23,
    "notes" TEXT,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferLine" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPriceNetGr" INTEGER NOT NULL,
    CONSTRAINT "OfferLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCard" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "sku" TEXT,
    "ean" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'Nowy',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceGrossGr" INTEGER NOT NULL,
    "keyParams" JSONB NOT NULL,
    "specs" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "rawPaste" TEXT,
    CONSTRAINT "ProductCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'szt.',
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "encryptedTokens" TEXT,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "connectedEmail" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "status" "CalendarSyncStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "errorMessage" TEXT,
    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "offerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "googleEventId" TEXT,
    "syncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'LOCAL_ONLY',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Job_code_key" ON "Job"("code");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_promisedPickupAt_idx" ON "Job"("promisedPickupAt");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Offer_number_key" ON "Offer"("number");
CREATE UNIQUE INDEX "Offer_publicToken_key" ON "Offer"("publicToken");
CREATE UNIQUE INDEX "ProductCard_offerId_key" ON "ProductCard"("offerId");
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "LoginAttempt_email_ip_createdAt_idx" ON "LoginAttempt"("email", "ip", "createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OfferLine" ADD CONSTRAINT "OfferLine_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCard" ADD CONSTRAINT "ProductCard_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

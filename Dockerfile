# ==========================================
# 1. مرحلة البناء (Build Stage)
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

# تثبيت متطلبات النظام الأساسية إن لزم الأمر
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# نسخ ملفات تعريف الحزم أولاً لاستغلال Docker Layer Caching
COPY package*.json ./

# تثبيت كامل الحزم (بما فيها Vite و esbuild وأدوات البناء)
RUN npm install

# نسخ ملفات الكود المصدري للمشروع
COPY . .

# تشغيل البناء (Vite للواجهة + esbuild لسيرفر Express)
RUN npm run build

# ==========================================
# 2. مرحلة التشغيل والإنتاج (Production Stage)
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

# تثبيت Chromium و FFmpeg والخطوط الأساسية لدعم Explainroo وإنتاج الفيديوهات الحركية
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# ضبط متغيرات البيئة الأساسية
ENV NODE_ENV=production
ENV PORT=8080
ENV EXPLAINROO_CHROME=/usr/bin/chromium

# نسخ الحزم الجاهزة مباشرة من مرحلة البناء لتفادي تعارض esbuild
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# نسخ مخرجات البناء من المرحلة الأولى
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# نسخ ملفات البيانات والإعدادات التي يحتاجها السيرفر عند الإقلاع
COPY --from=builder /app/data ./data
COPY --from=builder /app/explainroo ./explainroo
COPY --from=builder /app/ebooks-db.json ./ebooks-db.json
COPY --from=builder /app/voices.json ./voices.json
COPY --from=builder /app/vouchers.json ./vouchers.json
COPY --from=builder /app/platform_settings.json ./platform_settings.json
COPY --from=builder /app/metadata.json ./metadata.json

# المنفذ الافتراضي لـ Google Cloud Run
EXPOSE 8080

# أمر تشغيل السيرفر
CMD ["npm", "start"]

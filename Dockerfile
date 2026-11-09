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

# ضبط متغيرات البيئة الأساسية
ENV NODE_ENV=production
ENV PORT=8080

# نسخ ملفات الحزم لتثبيت تبعيات الإنتاج فقط لتقليل حجم الحاوية
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

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

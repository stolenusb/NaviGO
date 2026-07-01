FROM dunglas/frankenphp:1-php8.4-alpine

# Install core system dependencies required for Symfony/PostgreSQL
RUN apk add --no-cache \
    acl \
    file \
    gettext \
    git \
    icu-dev \
    libpq-dev \
    zip \
    unzip

# Install required PHP extensions
RUN docker-php-ext-install -j$(nproc) \
    intl \
    pdo \
    pdo_pgsql \
    opcache

# Use default development php.ini settings and bump limits for performance
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
    && sed -i 's/max_execution_time = 30/max_execution_time = 120/g' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/memory_limit = 128M/memory_limit = 512M/g' "$PHP_INI_DIR/php.ini"

# Pull down the latest stable Composer binary
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
# Use PostgreSQL 17 official image
FROM postgres:17-alpine

# Copy initialization scripts
COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432

# Set default command
CMD ["postgres"]
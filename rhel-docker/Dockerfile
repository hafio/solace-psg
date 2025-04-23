# Use Red Hat UBI as base image
FROM registry.access.redhat.com/ubi8/ubi

# Set environment variables
ENV LANG=en_US.UTF-8

# Install packages (example: curl, vim)
RUN dnf -y update && \
    dnf install -y curl vim && \
    dnf clean all

# Set working directory
WORKDIR /app

# Default command
CMD ["/bin/bash"]


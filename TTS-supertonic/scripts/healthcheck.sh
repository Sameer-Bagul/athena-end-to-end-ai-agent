#!/bin/bash

# Health check script
curl -f http://localhost:3000/health || exit 1
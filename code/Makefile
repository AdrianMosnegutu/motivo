.PHONY: help up down

COMPOSE ?= docker compose

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	SUDO := sudo
else
	SUDO :=
endif

DOCKER_COMPOSE := $(SUDO) $(COMPOSE)

help:
	@echo "Available targets:"
	@echo "  up    Build and start the Docker Compose stack"
	@echo "  down  Stop and remove Docker Compose containers"

up:
	$(DOCKER_COMPOSE) up --build

down:
	$(DOCKER_COMPOSE) down

# Interface JIBAYATIC – SATIM e-Payment Integration

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20SAP-blue)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED)
![Compliance](https://img.shields.io/badge/Compliance-SATIM%20Homologated-green)

## 📌 Overview

This project implements the **SATIM IPAY e-payment integration** for the **JIBAYATIC** platform. It provides a secure, compliant, and seamless payment flow between:

* **SAP Multichannel Foundation (MCF)** / SAP Backend
* **Middleware (Node.js)**
* **SATIM Payment Gateway**
* **React Frontend** (Confirmation & Result pages)

The solution is designed to meet **SATIM homologation requirements**, adheres to **SAP clean-core principles**, and follows strict **security best practices**.

---

## 🏗️ Architecture

The solution uses an NGINX reverse proxy to route traffic between the SAP backend and the custom Node.js middleware.

```mermaid
graph TD
    User[User Browser] -->|"[https://qas.local.test](https://qas.local.test)"| NGINX[NGINX Reverse Proxy]
    
    subgraph "Jibaya'tic Infrastructure"
        NGINX -->|/mondossier| SAP[SAP MCF / Backend]
        NGINX -->|/epayment| Middleware[Middleware + React FE]
    end
    
    subgraph "External"
        Middleware -->|/api/satim/register| SATIM[SATIM Payment Gateway]
    end

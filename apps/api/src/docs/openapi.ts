const bearerSecurity = [{ BearerAuth: [] }];

export const buildOpenApiSpec = (serverUrl: string) => ({
  openapi: "3.0.3",
  info: {
    title: "RMS API Documentation",
    version: "1.0.0",
    description:
      "Restaurant Management System API. Multi-tenant + RBAC + POS/KDS/Inventory/Payments/Reports."
  },
  servers: [
    {
      url: serverUrl,
      description: "Local API server"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Tenant" },
    { name: "Branch" },
    { name: "Menu" },
    { name: "Inventory" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Ebarimt" },
    { name: "KDS" },
    { name: "Reports" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    parameters: {
      XTenantId: {
        name: "x-tenant-id",
        in: "header",
        required: false,
        schema: { type: "string" },
        description:
          "Tenant context. Super admin үед аль tenant-ийн өгөгдөлтэй ажиллахаа сонгоно."
      },
      XBranchId: {
        name: "x-branch-id",
        in: "header",
        required: false,
        schema: { type: "string" },
        description:
          "Branch context. Branch-scoped endpoint дээр заавал шаардлагатай байж болно."
      },
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" }
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid payload" },
              details: { type: "object", nullable: true },
              requestId: { type: "string", nullable: true }
            }
          }
        }
      },
      SessionUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          tenantId: { type: "string", nullable: true },
          branchId: { type: "string", nullable: true },
          roles: {
            type: "array",
            items: { type: "string" }
          },
          permissions: {
            type: "array",
            items: { type: "string" }
          },
          isSuperAdmin: { type: "boolean" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "superadmin@rms.local" },
          password: { type: "string", example: "Admin@123" }
        }
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description: "Optional. Oruulahgui bol cookie-ees авна."
          }
        }
      },
      RegisterEmployeeRequest: {
        type: "object",
        required: ["email", "password", "fullName", "roleName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          fullName: { type: "string" },
          phone: { type: "string" },
          roleName: {
            type: "string",
            enum: ["ORG_ADMIN", "MANAGER", "CASHIER", "CHEF", "WAITER"]
          },
          branchId: {
            type: "string",
            description: "CASHIER/CHEF/WAITER role дээр required."
          }
        }
      },
      AuthSuccess: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/SessionUser" },
              accessToken: { type: "string" }
            }
          }
        }
      },
      TenantCreateRequest: {
        type: "object",
        required: ["code", "name"],
        properties: {
          code: { type: "string", example: "ORG11" },
          name: { type: "string", example: "My Restaurant Group" }
        }
      },
      BranchCreateRequest: {
        type: "object",
        required: ["code", "name"],
        properties: {
          tenantId: {
            type: "string",
            description: "Super admin branch үүсгэхэд required."
          },
          code: { type: "string", example: "B01" },
          name: { type: "string", example: "Downtown Branch" },
          address: { type: "string" },
          phone: { type: "string" }
        }
      },
      MenuServiceWindow: {
        type: "object",
        required: ["daysOfWeek", "startTime", "endTime"],
        properties: {
          label: { type: "string", example: "Lunch" },
          daysOfWeek: {
            type: "array",
            description: "1=Monday ... 7=Sunday",
            minItems: 1,
            items: { type: "integer", minimum: 1, maximum: 7 },
            example: [1, 2, 3, 4, 5]
          },
          startTime: { type: "string", example: "12:00" },
          endTime: { type: "string", example: "14:00" },
          enabled: { type: "boolean", example: true }
        }
      },
      MenuIngredient: {
        type: "object",
        required: ["inventoryItemId", "inventoryItemName", "quantity", "unit"],
        properties: {
          inventoryItemId: { type: "string" },
          inventoryItemName: { type: "string", example: "Beef" },
          quantity: { type: "number", example: 0.12 },
          unit: { type: "string", example: "kg" },
          wastePercent: { type: "number", minimum: 0, maximum: 100, example: 5 }
        }
      },
      MenuCreateRequest: {
        type: "object",
        required: ["category", "sku", "name", "price"],
        properties: {
          category: { type: "string", example: "Main" },
          sku: { type: "string", example: "MN-001" },
          name: { type: "string", example: "Beef Rice Bowl" },
          description: { type: "string" },
          price: { type: "number", example: 16500 },
          available: { type: "boolean", example: true },
          prepStation: { type: "string", example: "main" },
          tags: { type: "array", items: { type: "string" } },
          isSeasonal: { type: "boolean", example: true },
          seasonStartDate: {
            type: "string",
            format: "date-time",
            example: "2026-03-19T00:00:00.000Z"
          },
          seasonEndDate: {
            type: "string",
            format: "date-time",
            example: "2026-03-26T23:59:59.000Z"
          },
          serviceWindows: {
            type: "array",
            items: { $ref: "#/components/schemas/MenuServiceWindow" }
          },
          ingredients: {
            type: "array",
            items: { $ref: "#/components/schemas/MenuIngredient" }
          }
        }
      },
      MenuUpdateRequest: {
        type: "object",
        description: "At least one field is required",
        properties: {
          category: { type: "string", example: "Main" },
          sku: { type: "string", example: "MN-001" },
          name: { type: "string", example: "Beef Rice Bowl" },
          description: { type: "string" },
          price: { type: "number", example: 16500 },
          available: { type: "boolean", example: true },
          prepStation: { type: "string", example: "main" },
          tags: { type: "array", items: { type: "string" } },
          isSeasonal: { type: "boolean", example: true },
          seasonStartDate: {
            type: "string",
            format: "date-time",
            example: "2026-03-19T00:00:00.000Z"
          },
          seasonEndDate: {
            type: "string",
            format: "date-time",
            example: "2026-03-26T23:59:59.000Z"
          },
          serviceWindows: {
            type: "array",
            items: { $ref: "#/components/schemas/MenuServiceWindow" }
          },
          ingredients: {
            type: "array",
            items: { $ref: "#/components/schemas/MenuIngredient" }
          }
        }
      },
      MenuAvailabilityRequest: {
        type: "object",
        required: ["available"],
        properties: {
          available: { type: "boolean" }
        }
      },
      InventoryCreateRequest: {
        type: "object",
        required: ["sku", "name", "unit", "onHand", "reorderLevel", "averageCost"],
        properties: {
          sku: { type: "string", example: "INV-BEEF" },
          name: { type: "string", example: "Beef" },
          unit: { type: "string", example: "kg" },
          onHand: { type: "number", example: 30 },
          reorderLevel: { type: "number", example: 8 },
          averageCost: { type: "number", example: 22000 }
        }
      },
      InventoryAdjustRequest: {
        type: "object",
        required: ["quantity", "movementType"],
        properties: {
          quantity: { type: "number", example: 2 },
          movementType: { type: "string", enum: ["IN", "OUT", "ADJUSTMENT"] },
          unitCost: { type: "number", example: 1000 },
          note: { type: "string", example: "Manual correction" }
        }
      },
      OrderCreateItem: {
        type: "object",
        required: ["menuItemId", "itemName", "quantity", "unitPrice"],
        properties: {
          menuItemId: { type: "string" },
          sku: { type: "string" },
          itemName: { type: "string" },
          quantity: { type: "number", example: 2 },
          unitPrice: { type: "number", example: 7500 },
          discount: { type: "number", example: 0 },
          note: { type: "string" }
        }
      },
      OrderCreateRequest: {
        type: "object",
        required: ["items"],
        properties: {
          tableId: { type: "string", nullable: true },
          guestName: { type: "string" },
          note: { type: "string" },
          sendToKitchen: { type: "boolean", default: true },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderCreateItem" }
          }
        }
      },
      OrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["DRAFT", "SUBMITTED", "IN_PROGRESS", "READY", "SERVED", "CLOSED", "CANCELLED"]
          }
        }
      },
      PaymentCreateRequest: {
        type: "object",
        required: ["orderId", "amount", "method"],
        properties: {
          orderId: { type: "string" },
          amount: { type: "number", example: 25000 },
          method: {
            type: "string",
            enum: ["CASH", "CARD", "SOCIALPAY", "QPAY", "POCKET", "BANK_TRANSFER"]
          },
          externalRef: { type: "string" },
          ebarimt: {
            type: "object",
            properties: {
              customerType: { type: "string", enum: ["PERSONAL", "ORGANIZATION"] },
              customerName: { type: "string" },
              customerTin: { type: "string", description: "Organization register / TIN" },
              customerPhone: { type: "string" }
            }
          },
          payload: { type: "object", additionalProperties: true }
        }
      },
      EbarimtConfig: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          environment: { type: "string", enum: ["staging", "production"] },
          posApiBaseUrl: { type: "string", example: "http://localhost:7080" },
          merchantTin: { type: "string", example: "110718991986" },
          branchNo: { type: "string", example: "001" },
          posNo: { type: "string", example: "001" },
          districtCode: { type: "string", example: "2501" },
          defaultBillType: {
            type: "string",
            enum: ["B2C_RECEIPT", "B2B_RECEIPT", "B2C_INVOICE", "B2B_INVOICE"]
          },
          defaultTaxType: { type: "string", enum: ["VAT_ABLE", "VAT_FREE", "VAT_ZERO", "NOT_VAT"] },
          billIdSuffix: { type: "string", example: "01" },
          fallbackClassificationCode: { type: "string", example: "2349010" },
          defaultMeasureUnit: { type: "string", example: "ширхэг" },
          barCodeType: { type: "string", enum: ["GS1", "UNDEFINED"] },
          autoSendDataAfterIssue: { type: "boolean" },
          strictMode: { type: "boolean" },
          timeoutMs: { type: "number", example: 10000 },
          retryCount: { type: "number", example: 1 },
          storeSensitiveFields: { type: "boolean" },
          xApiKey: { type: "string", description: "Optional for operator endpoints" },
          merchantName: { type: "string" },
          branchName: { type: "string" },
          branchAddress: { type: "string" },
          branchPhone: { type: "string" },
          logoUrl: { type: "string" }
        }
      },
      EbarimtConfigUpdateRequest: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          environment: { type: "string", enum: ["staging", "production"] },
          posApiBaseUrl: { type: "string" },
          merchantTin: { type: "string" },
          branchNo: { type: "string" },
          posNo: { type: "string" },
          districtCode: { type: "string" },
          defaultBillType: {
            type: "string",
            enum: ["B2C_RECEIPT", "B2B_RECEIPT", "B2C_INVOICE", "B2B_INVOICE"]
          },
          defaultTaxType: { type: "string", enum: ["VAT_ABLE", "VAT_FREE", "VAT_ZERO", "NOT_VAT"] },
          billIdSuffix: { type: "string" },
          fallbackClassificationCode: { type: "string" },
          defaultMeasureUnit: { type: "string" },
          barCodeType: { type: "string", enum: ["GS1", "UNDEFINED"] },
          autoSendDataAfterIssue: { type: "boolean" },
          strictMode: { type: "boolean" },
          timeoutMs: { type: "number" },
          retryCount: { type: "number" },
          storeSensitiveFields: { type: "boolean" },
          xApiKey: { type: "string" },
          merchantName: { type: "string" },
          branchName: { type: "string" },
          branchAddress: { type: "string" },
          branchPhone: { type: "string" },
          logoUrl: { type: "string" }
        }
      },
      EbarimtIssueRequest: {
        type: "object",
        required: ["orderId", "amount", "method"],
        properties: {
          orderId: { type: "string" },
          amount: { type: "number", example: 125000 },
          method: {
            type: "string",
            enum: ["CASH", "CARD", "SOCIALPAY", "QPAY", "POCKET", "BANK_TRANSFER"]
          },
          customer: {
            type: "object",
            properties: {
              customerType: { type: "string", enum: ["PERSONAL", "ORGANIZATION"] },
              customerName: { type: "string" },
              customerTin: { type: "string" },
              customerPhone: { type: "string" }
            }
          }
        }
      },
      EbarimtVoidRequest: {
        type: "object",
        required: ["id", "date"],
        properties: {
          id: { type: "string", description: "Receipt batch id (billId)" },
          date: { type: "string", description: "Original receipt date from POS API" }
        }
      },
      EbarimtSaveMerchantsRequest: {
        type: "object",
        required: ["posNo", "merchantTins"],
        properties: {
          posNo: { type: "string" },
          merchantTins: { type: "array", items: { type: "string" } },
          xApiKey: { type: "string" }
        }
      },
      KdsStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["IN_PROGRESS", "READY", "SERVED"] }
        }
      },
      SuccessEnvelope: {
        type: "object",
        properties: {
          data: {}
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        service: { type: "string" },
                        status: { type: "string" },
                        timestamp: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccess" }
              }
            }
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },

    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Token refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccess" }
              }
            }
          }
        }
      }
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        responses: {
          "200": {
            description: "Logout success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current authenticated user",
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/SessionUser" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },

    "/api/auth/register-employee": {
      post: {
        tags: ["Auth"],
        summary: "Register employee",
        description: "Requires USER_WRITE permission",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterEmployeeRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Employee created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/SessionUser" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/tenants": {
      get: {
        tags: ["Tenant"],
        summary: "List tenants",
        description: "Requires TENANT_READ permission",
        security: bearerSecurity,
        parameters: [{ $ref: "#/components/parameters/XTenantId" }],
        responses: {
          "200": {
            description: "Tenant list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Tenant"],
        summary: "Create tenant (super admin)",
        description: "Requires TENANT_WRITE permission and super admin",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TenantCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Tenant created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" }
              }
            }
          }
        }
      }
    },

    "/api/tenants/current": {
      get: {
        tags: ["Tenant"],
        summary: "Get current tenant",
        security: bearerSecurity,
        parameters: [{ $ref: "#/components/parameters/XTenantId" }],
        responses: {
          "200": {
            description: "Current tenant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" }
              }
            }
          }
        }
      }
    },

    "/api/branches": {
      get: {
        tags: ["Branch"],
        summary: "List branches",
        security: bearerSecurity,
        parameters: [{ $ref: "#/components/parameters/XTenantId" }],
        responses: {
          "200": {
            description: "Branch list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Branch"],
        summary: "Create branch",
        description: "Requires BRANCH_WRITE permission",
        security: bearerSecurity,
        parameters: [{ $ref: "#/components/parameters/XTenantId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BranchCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Branch created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessEnvelope" }
              }
            }
          }
        }
      }
    },

    "/api/menu": {
      get: {
        tags: ["Menu"],
        summary: "List menu items",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "Menu list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      },
      post: {
        tags: ["Menu"],
        summary: "Create menu item",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Menu created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/menu/{id}/availability": {
      patch: {
        tags: ["Menu"],
        summary: "Enable/disable menu item",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuAvailabilityRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/menu/{id}": {
      patch: {
        tags: ["Menu"],
        summary: "Update menu item",
        description: "Supports seasonal windows, service windows, and ingredient updates.",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MenuUpdateRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Menu updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          },
          "404": {
            description: "Menu item not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },

    "/api/inventory": {
      get: {
        tags: ["Inventory"],
        summary: "List inventory items",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "Inventory list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      },
      post: {
        tags: ["Inventory"],
        summary: "Create inventory item",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InventoryCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Inventory created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/inventory/{id}/adjust": {
      post: {
        tags: ["Inventory"],
        summary: "Adjust stock",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InventoryAdjustRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Adjusted",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "Order list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      },
      post: {
        tags: ["Orders"],
        summary: "Create order",
        description: "POS order create. sendToKitchen=true бол KDS ticket үүснэ.",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Order created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderStatusRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/payments": {
      post: {
        tags: ["Payments"],
        summary: "Create payment",
        description: "Pay now or partial pay. Order payment status автоматаар шинэчлэгдэнэ.",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentCreateRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Payment created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/config": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get branch ebarimt config",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "Current ebarimt config",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/EbarimtConfig" }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Ebarimt"],
        summary: "Update branch ebarimt config",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EbarimtConfigUpdateRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Updated config",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/EbarimtConfig" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ebarimt/issue": {
      post: {
        tags: ["Ebarimt"],
        summary: "Issue ebarimt for order",
        description: "Issues a POSAPI 3.0 receipt using order/payment details.",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EbarimtIssueRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Issue result",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/void": {
      post: {
        tags: ["Ebarimt"],
        summary: "Void / return issued ebarimt",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EbarimtVoidRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Void result",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/pos/info": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get local POS API runtime info",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "POS API info",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/pos/send-data": {
      post: {
        tags: ["Ebarimt"],
        summary: "Trigger POS API /sendData",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "sendData result",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/pos/bank-accounts": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get bank accounts by TIN from local POS API",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" },
          { name: "tin", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Bank accounts",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/refs/district-codes": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get district/sub-district code reference",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "District reference list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/refs/tin-by-regno": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get TIN by register number",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" },
          { name: "regNo", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "TIN info",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/refs/taxpayer-info": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get taxpayer profile by TIN",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" },
          { name: "tin", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Taxpayer profile",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/refs/product-tax-codes": {
      get: {
        tags: ["Ebarimt"],
        summary: "Get VAT_FREE / VAT_ZERO product tax codes",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        responses: {
          "200": {
            description: "Tax code list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },
    "/api/ebarimt/operator/save-merchants": {
      post: {
        tags: ["Ebarimt"],
        summary: "Request operator merchant registration",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EbarimtSaveMerchantsRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Operator request result",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/kds": {
      get: {
        tags: ["KDS"],
        summary: "List KDS tickets",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "station",
            in: "query",
            required: false,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Ticket list",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/kds/{id}/status": {
      patch: {
        tags: ["KDS"],
        summary: "Update KDS ticket status",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
          { $ref: "#/components/parameters/XTenantId" },
          { $ref: "#/components/parameters/XBranchId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KdsStatusRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Ticket updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    },

    "/api/reports/summary": {
      get: {
        tags: ["Reports"],
        summary: "Sales summary report",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/XTenantId" },
          {
            name: "branchId",
            in: "query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "start",
            in: "query",
            required: false,
            schema: { type: "string", example: "2026-03-18" }
          },
          {
            name: "end",
            in: "query",
            required: false,
            schema: { type: "string", example: "2026-03-18" }
          }
        ],
        responses: {
          "200": {
            description: "Financial summary",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } }
            }
          }
        }
      }
    }
  }
});

/// <reference path="../../../../typings/tsd.d.ts" />

/// <reference path="../ArmTemplate.ts" />
/// <reference path="../Resource.ts" />

(function() {
  'use strict';

  describe('401gen', function(){
	var graph;
		
	beforeEach(function() {
		graph = new ArmViz.ArmTemplate(template);
	});
    
    it('should parse', function() {
	});
  });
  
  //https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/201-alert-to-queue-with-logic-app/azuredeploy.json
  var template =
  {
    "$schema": "http://schema.management.azure.com/schemas/2015-01-01-preview/deploymentTemplate.json",
    "contentVersion": "1.0.0.0",
    "parameters": {
        "uniqueBit": {
            "type": "string",
            "metadata": {
                "description": "This unique bit will be used on all the objects created as part of this template."
            }
        },
        "transferVMSize": {
            "type": "string",
            "defaultValue": "Standard_D4",
            "allowedValues": [
                "Standard_A4",
                "Standard_A7",
                "Standard_D4",
                "Standard_D14"
            ]
        },
        "computeVMSize": {
            "type": "string",
            "defaultValue": "Standard_A1",
            "allowedValues": [
                "Standard_A1",
                "Standard_A2",
                "Standard_A3",
                "Standard_A4",
                "Standard_A5",
                "Standard_A6",
                "Standard_A7",
                "Standard_A8",
                "Standard_A9",
                "Standard_A10",
                "Standard_A11",
                "Standard_D1",
                "Standard_D2",
                "Standard_D3",
                "Standard_D4",
                "Standard_D11",
                "Standard_D12",
                "Standard_D13",
                "Standard_D14"
            ]
        },
        "computeOSType": {
            "type": "string",
            "defaultValue": "Linux",
            "allowedValues": [
                "Linux",
                "Windows"
            ]
        },
        "deploymentType": {
            "type": "string",
            "defaultValue": "VMSS",
            "allowedValues": [
                "VMSS",
                "Single",
                "SingleAV"
            ],
            "metadata": {
                "description": "This determines whether the VMs will be deployed using scale sets, as individual VMs, or individual VMs in an availability set (maximum 100 for the last option)."
            }
        },
        "numberOfSAs": {
            "type": "int"
        },
        "instanceCountPerSA": {
            "type": "int"
        },
        "imageLocation": {
            "type": "string"
        },
        "imageKey": {
            "type": "string"
        },
        "adminUsername": {
            "type": "string"
        },
        "adminPassword": {
            "type": "securestring"
        }
    },
    "variables": {
        "vnetName": "[concat(parameters('uniqueBit'), 'vnet')]",
        "addressPrefix": "10.0.0.0/16",
        "subnetName": "subnet",
        "subnetPrefix": "10.0.0.0/21",
        "storageAccountType": "Standard_LRS",
        "location": "[resourceGroup().location]",
        "transferImagePublisher": "Canonical",
        "transferImageOffer": "UbuntuServer",
        "ubuntuOSVersion": "15.04",
        "imagePieces": "[split(parameters('imageLocation'),'/')]", 
        "blobName": "[variables('imagePieces')[sub(length(variables('imagePieces')),1)]]",

        "templateLocation":  "https://raw.githubusercontent.com/AlanSt/azure-quickstart-templates/401gen/001/",

        "commonObjectTemplateUri": "[concat(variables('templateLocation'), 'common_object.json')]",
        "uploadTemplateUri": "[concat(variables('templateLocation'), 'upload.json')]",
        "finalTemplateUri": "[concat(variables('templateLocation'), 'final_')]",

        "downloadTemplateURI": "[concat(variables('templateLocation'), 'download.json')]",
        "downloadScriptURI": "[concat(variables('templateLocation'), 'download.sh')]",
        "uploadTemplateURI": "[concat(variables('templateLocation'), 'upload.json')]",
        "uploadScriptURI": "[concat(variables('templateLocation'), 'upload.sh')]",
        "transferTemplateURI": "[concat(variables('templateLocation'), 'transfer.json')]",
        "transferScriptURI": "[concat(variables('templateLocation'), 'transfer.sh')]",

        "automationTemplateURI": "[concat(variables('templateLocation'), 'automation.json')]",
        "runbookScriptURI": "[concat(variables('templateLocation'), 'keymovement.ps1')]"

    },
    "resources": [
        {
            "name": "[concat(parameters('uniqueBit'), 'base')]",
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2015-01-01",
            "properties": {
                "mode": "Incremental",
                "templateLink": {
                    "uri": "[variables('commonObjectTemplateUri')]",
                    "contentVersion": "1.0.0.0"
                },
                "parameters": {
                    "uniqueBit": { "value": "[parameters('uniqueBit')]" },
                    "numberOfSAs": { "value": "[parameters('numberOfSAs')]" },
                    "vnetName": { "value": "[variables('vnetName')]" },
                    "addressPrefix": { "value": "[variables('addressPrefix')]" },
                    "subnetName": { "value": "[variables('subnetName')]" },
                    "subnetPrefix": { "value": "[variables('subnetPrefix')]" },
                    "location": { "value": "[variables('location')]" }
                }
            }
        },
        {
            "type": "Microsoft.Storage/storageAccounts",
            "name": "[concat('transfer', parameters('uniqueBit'), 'sa')]",
            "apiVersion": "2015-05-01-preview",
            "location": "[variables('location')]",
            "properties": {
                "accountType": "Standard_LRS"
            }
        },
        {
            "apiVersion": "2015-05-01-preview",
            "type": "Microsoft.Network/publicIPAddresses",
            "name": "[concat('transfer', parameters('uniqueBit'), 'ip')]",
            "location": "[variables('location')]",
            "properties": {
                "publicIPAllocationMethod": "Dynamic"
            }
        },
        {
            "apiVersion": "2015-05-01-preview",
            "type": "Microsoft.Network/networkInterfaces",
            "name": "[concat('transfer', parameters('uniqueBit'), 'nic')]",
            "location": "[variables('location')]",
            "dependsOn": [
                "[concat('Microsoft.Network/publicIPAddresses/transfer', parameters('uniqueBit'), 'ip')]",
                "[concat('Microsoft.Resources/deployments/', parameters('uniqueBit'), 'base')]"
            ],
            "properties": {
                "ipConfigurations": [
                    {
                        "name": "ipconfig1",
                        "properties": {
                            "privateIPAllocationMethod": "Dynamic",
                            "publicIPAddress": {
                                "id": "[resourceId('Microsoft.Network/publicIPAddresses', concat('transfer', parameters('uniqueBit'), 'ip'))]"
                            },
                            "subnet": {
                                "id": "[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/virtualNetworks/', variables('vnetName'), '/subnets/', variables('subnetName'))]"
                            }
                        }
                    }
                ]
            }
        },
        {
            "apiVersion": "2015-06-15",
            "type": "Microsoft.Compute/virtualMachines",
            "name": "[concat('transfer', parameters('uniqueBit'), 'vm')]",
            "location": "[variables('location')]",
            "dependsOn": [
                "[concat('Microsoft.Storage/storageAccounts/transfer', parameters('uniqueBit'), 'sa')]",
                "[concat('Microsoft.Network/networkInterfaces/transfer', parameters('uniqueBit'), 'nic')]"
            ],
            "properties": {
                "hardwareProfile": {
                    "vmSize": "[parameters('transferVMSize')]"
                },
                "osProfile": {
                    "computername": "[concat('transfer', parameters('uniqueBit'), 'vm')]",
                    "adminUsername": "[parameters('adminUsername')]",
                    "adminPassword": "[parameters('adminPassword')]"
                },
                "storageProfile": {
                    "imageReference": {
                        "publisher": "[variables('transferImagePublisher')]",
                        "offer": "[variables('transferImageOffer')]",
                        "sku": "[variables('ubuntuOSVersion')]",
                        "version": "latest"
                    },
                    "osDisk": {
                        "name": "osdisk",
                        "vhd": {
                            "uri": "[concat('http://transfer',parameters('uniqueBit'),'sa.blob.core.windows.net/transfervm/transfervm.vhd')]"
                        },
                        "caching": "ReadWrite",
                        "createOption": "FromImage"
                    }
                },
                "networkProfile": {
                    "networkInterfaces": [
                        {
                            "id": "[resourceId('Microsoft.Network/networkInterfaces', concat('transfer', parameters('uniqueBit'), 'nic'))]"
                        }
                    ]
                },
                "diagnosticsProfile": {
                    "bootDiagnostics": {
                        "enabled": "true",
                        "storageUri": "[concat('http://transfer',parameters('uniqueBit'),'sa.blob.core.windows.net')]"
                    }
                }
            }
        },
        {
            "name": "[concat(parameters('uniqueBit'), 'script0')]",
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2015-01-01",
            "dependsOn": [
                "[concat('Microsoft.Compute/virtualMachines/transfer', parameters('uniqueBit'), 'vm')]"
            ],
            "properties": {
                "mode": "Incremental",
                "templateLink": {
                    "uri": "[variables('downloadTemplateURI')]",
                    "contentVersion": "1.0.0.0"
                },
                "parameters": {
                    "location": { "value": "[variables('location')]" },
                    "uniqueBit": { "value": "[parameters('uniqueBit')]" },
                    "imageLocation": { "value": "[parameters('imageLocation')]" },
                    "imageKey": { "value": "[parameters('imageKey')]" },
                    "downloadScriptURI": { "value": "[variables('downloadScriptURI')]" }
                }
            }
        },
        {
            "name": "[concat(parameters('uniqueBit'), 'script', string(add(copyIndex(), 1)))]",
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2015-01-01",
            "dependsOn": [
                "[concat('Microsoft.Resources/deployments/', parameters('uniqueBit'), 'script', copyIndex())]"
            ],
            "copy": {
                "name": "uploadLoop",
                "count": "[parameters('numberOfSAs')]"
            },
            "properties": {
                "mode": "Incremental",
                "templateLink": {
                    "uri": "[variables('uploadTemplateURI')]",
                    "contentVersion": "1.0.0.0"
                },
                "parameters": {
                    "location": { "value": "[variables('location')]" },
                    "uniqueBit": { "value": "[parameters('uniqueBit')]" },
                    "index": { "value": "[copyIndex()]" },
                    "uploadScriptURI": { "value": "[variables('uploadScriptURI')]" }
                }
            }
        },
        {
            "name": "[concat(parameters('uniqueBit'), 'full')]",
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2015-01-01",
            "dependsOn": [
                "uploadLoop"
            ],
            "properties": {
                "mode": "Incremental",
                "templateLink": {
                    "uri": "[concat(variables('finalTemplateUri'), parameters('deploymentType'), '.json')]",
                    "contentVersion": "1.0.0.0"
                },
                "parameters": {
                    "uniqueBit": { "value": "[parameters('uniqueBit')]" },
                    "numberOfSAs": { "value": "[parameters('numberOfSAs')]" },
                    "instanceCountPerSA": { "value": "[parameters('instanceCountPerSA')]" },
                    "vmSize": { "value": "[parameters('computeVMSize')]" },
                    "OSType": { "value": "[parameters('computeOSType')]" },
                    "blobName": { "value": "[variables('blobName')]" },
                    "vnetName": { "value": "[variables('vnetName')]" },
                    "addressPrefix": { "value": "[variables('addressPrefix')]" },
                    "subnetName": { "value": "[variables('subnetName')]" },
                    "subnetPrefix": { "value": "[variables('subnetPrefix')]" },
                    "templateLocation": { "value": "[variables('templateLocation')]" },
                    "location": { "value": "[variables('location')]" },
                    "adminUsername": { "value": "[parameters('adminUsername')]" },
                    "adminPassword": { "value": "[parameters('adminPassword')]" }
                }
            }
        }
    ]
}

})();
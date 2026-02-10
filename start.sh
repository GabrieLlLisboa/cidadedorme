#!/bin/bash

# Script de teste local para Cidade Dorme
# Execute este script para iniciar o servidor local

echo "🌙 Iniciando Cidade Dorme..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não encontrado!"
    echo "Por favor, instale Node.js 18+ em https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node -v) detectado"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null
then
    echo "❌ npm não encontrado!"
    exit 1
fi

echo "✓ npm $(npm -v) detectado"
echo ""

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎮 Cidade Dorme está rodando!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Acesse: http://localhost:3000"
echo ""
echo "  📱 Na mesma rede Wi-Fi:"
echo "     http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "  ⌨️  Pressione Ctrl+C para parar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm start

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@rumirent.com' }
    })

    if (!admin) {
      console.log('No admin user found')
      return
    }

    console.log('Admin user found:')
    console.log('Email:', admin.email)
    console.log('Role:', admin.role)
    console.log('Active:', admin.activo)
    console.log('Password hash length:', admin.password.length)

    // Test password
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, admin.password)
    console.log(`Password "${testPassword}" is valid:`, isValid)

    // If password is invalid, update it
    if (!isValid) {
      console.log('Updating admin password...')
      const newHashedPassword = await bcrypt.hash('admin123', 12)
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: newHashedPassword }
      })
      console.log('Password updated successfully')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ContactService } from "./contact.service";

@Controller('')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    async createContact(@Body() data: any) {
        return this.contactService.createContact(data);
    }

    @Get()
    async getContactInfo() {
        return this.contactService.getContactInfo();
    }

    @Put(':id')
    async updateContact(@Param('id') id: number, @Body() data: any) {
        return this.contactService.updateContact(id, data);
    }

    @Delete(':id')
    async deleteContact(@Param('id') id: number) {
        return this.contactService.deleteContact(id);
    }
}
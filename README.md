# amazon-bill-downloader
This project lets you download invoices from your amazon account using order ids. This uses nightmare js for crawling the amazon web pages and saving invoices as pdfs.
Input needs to be given as a csv file while executing the script.

Usage: node bill.js <your_csv_file>

A sample csv file is also attached here which can be referred. Also, You need to copy your amazon session in amazonCookie.txt file before starting to use this script. This will allow nightmare to crawl amazon.in for your account without login
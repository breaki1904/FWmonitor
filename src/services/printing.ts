'use strict';

import { execShellCommand, fileExists } from '../utils/common';

import config from '../utils/config';
import fs from 'fs';
import globalEvents from '../utils/globalEvents';
import ipp from 'ipp';
import logging from '../utils/logging';
import puppeteer from 'puppeteer';

const NAMESPACE = 'Printing_Service';

class PrintingService {
    private lastPaperState = false;
    private isFirstPaperCheck = true;
    private isPaperStatusError = false;

    public init() {
        setInterval(this.checkPaper.bind(this), config.paper.interval);
    }

    private async checkPaper() {
        logging.debug(NAMESPACE, 'ckeckPaper()');

        let response: boolean | null | undefined = null;
        if (config.printing.print_ipp_url && !config.paper.printer_path) {
            response = await this.checkPaper_ipp();
        }
        if (config.paper.printer_path && config.paper.printer_regex) {
            response = await this.checkPaper_http();
        }

        if (response == null) return;
        if (response == undefined) {
            if (!this.isPaperStatusError) {
                // Error
                globalEvents.emit(
                    'softwareinfo',
                    'Papierstatus Fehler: Papierstatus konnte nicht ausgelesen werden!'
                );
            }
            this.isPaperStatusError = true;
            return;
        }
        this.isPaperStatusError = false;

        if (!this.isFirstPaperCheck) {
            if (response != this.lastPaperState) {
                // Status Change
                globalEvents.emit('paperstatus-change', response);
            }
            this.lastPaperState = response;
        }
        this.isFirstPaperCheck = false;

        return false;
    }

    private async checkPaper_ipp(): Promise<boolean | undefined> {
        return new Promise(function (resolve) {
            if (!config.printing.print_ipp_url) {
                resolve(undefined);
                return;
            }

            const printer = new ipp.Printer(config.printing.print_ipp_url);

            const msg: ipp.GetPrinterAttributesRequest = {
                'operation-attributes-tag': {
                    'attributes-charset': 'utf-8',
                    'attributes-natural-language': 'en',
                    'requesting-user-name': 'User'
                }
            };

            printer.execute(
                'Get-Printer-Attributes',
                msg,
                (error: Error, response: ipp.GetPrinterAttributesResponse) => {
                    if (error) {
                        resolve(undefined);
                        return;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pat: any = response['printer-attributes-tag'];

                    logging.debug(NAMESPACE, 'Status: ' + pat['printer-state']);
                    logging.debug(NAMESPACE, 'Grund: ' + pat['printer-state-reasons']);

                    if (
                        pat['printer-state-reasons'] &&
                        pat['printer-state-reasons'].indexOf('media-empty') != -1
                    ) {
                        resolve(true);
                        return;
                    } else {
                        resolve(false);
                        return;
                    }
                }
            );

            resolve(undefined);
        });
    }

    private async checkPaper_http() {
        if (!config.paper.printer_path || !config.paper.printer_regex) return undefined;

        let browser;

        try {
            browser = await puppeteer.launch();

            const [page] = await browser.pages();

            await page.goto(config.paper.printer_path, {
                waitUntil: ['load', 'domcontentloaded', 'networkidle0']
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const data = await page.evaluate(() => document.querySelector('*').outerHTML);
            await browser.close();

            // Faxfilter anwenden
            const regex = RegExp(config.paper.printer_regex, 'gi');
            if (!regex.test(data)) {
                return false;
            }
            return true;
        } catch (error) {
            logging.exception(NAMESPACE, error);
            await browser?.close();
            return undefined;
        }
    }

    public print(file_without_extension: string) {
        logging.debug(NAMESPACE, 'Print ' + file_without_extension + '...');
        if (config.raspiversion && config.printing.print_printername) {
            logging.debug(NAMESPACE, 'Printfunction Raspberry');
            return this.print_raspberry(file_without_extension);
        }
        if (!config.raspiversion && config.programs.foxit) {
            logging.debug(NAMESPACE, 'Printfunction Windows');
            return this.print_windows(file_without_extension);
        }
        if (config.printing.print_ipp_url) {
            logging.debug(NAMESPACE, 'Printfunction IPP');
            return this.print_ipp(file_without_extension);
        }

        logging.debug(NAMESPACE, 'Printfunction error');
    }

    private async print_raspberry(file_without_extension: string) {
        // PDF
        if (await fileExists(file_without_extension + '.pdf')) {
            logging.debug(NAMESPACE, 'print_raspberry > pdf');
            const out = await execShellCommand(
                `lp -d ${config.printing.print_printername} "${file_without_extension}.pdf"`
            );
            logging.debug(NAMESPACE, 'print_raspberry stdout:', out);
            return true;
        }

        // TIFF
        if (await fileExists(file_without_extension + '.tif')) {
            logging.debug(NAMESPACE, 'print_raspberry > tif');
            const out = await execShellCommand(
                `sudo /usr/bin/tiff2ps -a -p "${file_without_extension}.tif" |lpr -P ${config.printing.print_printername}`
            );
            logging.debug(NAMESPACE, 'print_raspberry stdout:', out);
            return true;
        }
        if (await fileExists(file_without_extension + '.tiff')) {
            logging.debug(NAMESPACE, 'print_raspberry > tiff');
            const out = await execShellCommand(
                `sudo /usr/bin/tiff2ps -a -p "${file_without_extension}.tiff" |lpr -P ${config.printing.print_printername}`
            );
            logging.debug(NAMESPACE, 'print_raspberry stdout:', out);
            return true;
        }

        // TXT
        if (await fileExists(file_without_extension + '.txt')) {
            logging.debug(NAMESPACE, 'print_raspberry > txt');
            const out = await execShellCommand(
                `sudo /usr/bin/tiff2ps -a -p "${file_without_extension}.txt" |lpr -P ${config.printing.print_printername}`
            );
            logging.debug(NAMESPACE, 'print_raspberry stdout:', out);
            return true;
        }

        logging.debug(NAMESPACE, 'print_raspberry error');
        return false;
    }

    private async print_windows(file_without_extension: string) {
        // PDF
        if (await fileExists(file_without_extension + '.pdf')) {
            logging.debug(NAMESPACE, 'print_windows > pdf');
            const out = await execShellCommand(
                `"${config.programs.foxit}" /p "${file_without_extension}.pdf"`
            );
            logging.debug(NAMESPACE, 'print_windows stdout:', out);
            return true;
        }

        // TXT
        if (await fileExists(file_without_extension + '.txt')) {
            logging.debug(NAMESPACE, 'print_windows > txt');
            const out = await execShellCommand(`notepad /p "${file_without_extension}.txt"`);
            logging.debug(NAMESPACE, 'print_windows stdout:', out);
            return true;
        }

        logging.debug(NAMESPACE, 'print_windows error');
        return false;
    }

    private async print_ipp(file_without_extension: string) {
        if (!config.printing.print_ipp_url) return false;
        const printer = new ipp.Printer(config.printing.print_ipp_url);

        let extension: string | undefined;
        if (await fileExists(file_without_extension + '.tif')) extension = '.tif';
        if (await fileExists(file_without_extension + '.tiff')) extension = '.tiff';
        if (await fileExists(file_without_extension + '.txt')) extension = '.txt';

        if (!extension) return false;

        fs.readFile(file_without_extension + extension, (err, data) => {
            const msg: ipp.PrintJobRequest = {
                'operation-attributes-tag': {
                    'requesting-user-name': 'User',
                    'job-name': 'Print Job',
                    'document-format': 'application/octet-stream'
                },
                data: Buffer.from(data)
            };

            logging.debug(NAMESPACE, 'print_ipp > ' + extension);
            printer.execute('Print-Job', msg, (error: Error, response: ipp.PrintJobResponse) => {
                logging.debug(NAMESPACE, 'err', error);
                logging.debug(NAMESPACE, 'res', response);
            });
        });
    }
}

export default new PrintingService();

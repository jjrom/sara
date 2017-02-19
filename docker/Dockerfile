#
# GAUSS installation based on centos6 distrib
#
FROM centos:centos6
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN rpm -Uvh http://yum.postgresql.org/9.5/redhat/rhel-6-x86_64/pgdg-redhat95-9.5-2.noarch.rpm
RUM yum -y install epel-release git wget unzip nginx postgresql95-server postgresql95 postgresql95-contrib postgis2_95 postgis2_95-utils postgis2_95-client; yum clean all
RUM yum -y install php php-pgsql

CMD ["/bin/bash"]
